import React, { useState, useEffect, createContext, useContext } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useSession } from '@/providers/SessionProvider';

export type UserRole = 'admin' | 'property_manager' | 'vendor' | 'tenant';

// Enhanced user interface for backward compatibility
export interface User extends SupabaseUser {
  // Basic properties
  name?: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
  avatar_url?: string;
  lastLogin?: string;
  
  // Vendor-specific properties
  vendor?: {
    isVerified: boolean;
    companyName?: string;
    avatarUrl?: string;
    specialties: string[];
    rating: number;
    completedJobs: number;
    responseTime: string;
    certifications: string[];
    insurance: boolean;
    backgroundCheck: boolean;
  };
  
  // Subscription properties
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'trial' | 'expired';
    expiresAt?: string;
    features: string[];
  };
  
  // Additional properties
  properties?: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isSubscribed: (tier: string) => boolean;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  userRoles: string[];
  getUserRole: () => UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use SessionProvider's session as single source of truth
  const { session, isLoading: sessionLoading } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Get the primary user role for display purposes
  const getUserRole = (): UserRole => {
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('property_manager')) return 'property_manager';
    if (userRoles.includes('vendor')) return 'vendor';
    return 'tenant';
  };

  // Enhanced user creation with backward compatibility
  const createEnhancedUser = async (supabaseUser: SupabaseUser, roles: string[]): Promise<User> => {
    // Get additional user data from profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, phone, role, avatar_url')
      .eq('id', supabaseUser.id)
      .single();

    // Get vendor data and subscription if user is a vendor
    let vendorData = null;
    let subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise' = 'free';
    if (roles.includes('vendor')) {
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('is_verified, rating, company_name, subscription_plan, avatar_url')
        .eq('user_id', supabaseUser.id)
        .single();

      if (vendorProfile) {
        vendorData = {
          isVerified: vendorProfile.is_verified || false,
          companyName: vendorProfile.company_name,
          avatarUrl: vendorProfile.avatar_url || profileData?.avatar_url, // Fallback to profile avatar
          specialties: [],
          rating: vendorProfile.rating || 0,
          completedJobs: 0,
          responseTime: '2 hours',
          certifications: [],
          insurance: false,
          backgroundCheck: false
        };
        // Use subscription_plan from vendorProfile - prioritize verified status for plan upgrade
        if (vendorProfile.subscription_plan) {
          const allowedPlans = ['free', 'basic', 'premium', 'enterprise'] as const;
          if (allowedPlans.includes(vendorProfile.subscription_plan as any)) {
            subscriptionPlan = vendorProfile.subscription_plan as typeof subscriptionPlan;
          }
        }
        // If vendor is verified but no specific plan, default to premium
        if (vendorProfile.is_verified && subscriptionPlan === 'free') {
          subscriptionPlan = 'premium';
        }
      }
    }

    // Get avatar URL from vendor profile or profile
    let avatarUrl = profileData?.avatar_url;
    if (roles.includes('vendor') && vendorData?.avatarUrl) {
      avatarUrl = vendorData.avatarUrl;
    }

    // Create enhanced user object by copying all properties
    const enhancedUser = {
      ...supabaseUser,
      name: profileData?.full_name || supabaseUser.email?.split('@')[0] || '',
      full_name: profileData?.full_name || '',
      phone: profileData?.phone || '',
      role: (profileData?.role || getUserRole()) as UserRole,
      avatar_url: avatarUrl,
      lastLogin: new Date().toISOString(),
      vendor: vendorData,
      subscription: {
        plan: subscriptionPlan,
        status: subscriptionPlan !== 'free' ? 'active' as const : 'inactive' as const,
        features: [],
        expiresAt: subscriptionPlan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
      },
      properties: [],
      permissions: roles.includes('admin') ? ['*'] : []
    } as User;

    return enhancedUser;
  };

  // Role caching layer for performance optimization
  const roleCache = new Map<string, { roles: string[], timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Fetch user roles efficiently with caching
  const fetchUserRoles = async (userId: string): Promise<string[]> => {
    try {
      // Check cache first
      const cached = roleCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('Role cache hit for user:', userId);
        return cached.roles;
      }

      logger.debug('Role cache miss, fetching from database for user:', userId);

      // First try to get role from profiles table (faster)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profileError && profileData?.role) {
        const roles = [profileData.role];
        roleCache.set(userId, { roles, timestamp: Date.now() });
        return roles;
      }

      // Fallback to user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const roles = data?.map(item => item.role) || ['tenant'];
      roleCache.set(userId, { roles, timestamp: Date.now() });
      
      return roles;
    } catch (error) {
      logger.error('Error fetching user roles:', error);
      return ['tenant']; // Default fallback
    }
  };

  // Initialize auth state based on SessionProvider's session
  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      if (sessionLoading || !isMounted) return; // Wait for session to load
      
      try {
        if (session?.user) {
          // Fetch roles
          const roles = await fetchUserRoles(session.user.id);
          const enhancedUser = await createEnhancedUser(session.user, roles);
          
          if (isMounted) {
            setUser(enhancedUser);
            setUserRoles(roles);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setUserRoles([]);
          }
        }
      } catch (error: any) {
        logger.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setUserRoles([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUserData();

    return () => {
      isMounted = false;
    };
  }, [session, sessionLoading]);

  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be')) {
          toast.error('Password must be at least 6 characters long.');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        return { error };
      }

      toast.success('Account created successfully! Please check your email for verification.');
      return { error: null };
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Signup error:', error);
      }
      toast.error('An unexpected error occurred during signup');
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account before signing in.');
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
        return { error };
      }

      toast.success('Signed in successfully!');
      return { error: null };
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Signin error:', error);
      }
      toast.error('An unexpected error occurred during sign in');
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[DEV] Signout error:', error);
        }
        toast.error('Error signing out');
      } else {
        setUser(null);
        setUserRoles([]);
        toast.success('Signed out successfully');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Signout error:', error);
      }
      toast.error('An unexpected error occurred during sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userRoles.length) return false;
    
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    
    return userRoles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    // Simple implementation - could be extended
    return hasRole(['admin', 'property_manager']);
  };

  const isSubscribed = (tier: string): boolean => {
    // Simple implementation - for now all authenticated users have basic access
    if (!user) return false;
    
    // Admin and property managers always have access
    if (hasRole(['admin', 'property_manager'])) return true;
    
    // For now, all vendors have basic access
    if (hasRole('vendor')) {
      return tier === 'basic' || tier === 'premium' || tier === 'enterprise';
    }
    
    return false;
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) {
        throw new Error('No user found');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      return { error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
      return { error };
    }
  };

  // Refresh user data from database
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const roles = await fetchUserRoles(user.id);
      const enhancedUser = await createEnhancedUser(user, roles);
      setUser(enhancedUser);
      setUserRoles(roles);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...userData } : prev);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update profile');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signOut,
    logout: signOut, // Alias for backward compatibility
    hasRole,
    hasPermission,
    isSubscribed,
    updateProfile,
    updateUser,
    refreshUser,
    userRoles,
    getUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};