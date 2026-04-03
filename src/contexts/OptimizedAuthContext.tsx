import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { AuthError, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { withRateLimit } from '@/lib/rateLimit';

export type UserRole = 'admin' | 'property_manager' | 'vendor' | 'tenant';

// Enhanced user interface for backward compatibility
export interface User extends SupabaseUser {
  name?: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
  avatar_url?: string;
  lastLogin?: string;

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

  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'trial' | 'expired';
    expiresAt?: string;
    features: string[];
  };

  properties?: string[];
  permissions?: string[];
}

interface UserProfileWithRoles {
  profile?: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
  };
  roles?: string[] | string;
  vendor_profile?: {
    is_verified?: boolean;
    company_name?: string;
    avatar_url?: string;
    rating?: number;
    subscription_plan?: 'free' | 'basic' | 'premium' | 'enterprise' | string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, userData?: Record<string, unknown>) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isSubscribed: (tier: string) => boolean;
  updateProfile: (updates: Record<string, unknown>) => Promise<{ error: AuthError | null }>;
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

// Cache for user profile data
interface ProfileCache {
  data: UserProfileWithRoles | null;
  timestamp: number;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const profileCache = new Map<string, ProfileCache>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const initialLoadDone = useRef(false);

  const getUserRole = useCallback((): UserRole => {
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('property_manager')) return 'property_manager';
    if (userRoles.includes('vendor')) return 'vendor';
    return 'tenant';
  }, [userRoles]);

  // Fetch user profile with roles using optimized RPC (single query)
  const fetchUserProfileWithRoles = useCallback(async (userId: string): Promise<UserProfileWithRoles | null> => {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Profile cache hit for user:', userId);
      return cached.data;
    }

    logger.debug('Profile cache miss, fetching from database');

    try {
      const { data, error } = await supabase.rpc('get_user_profile_with_roles', {
        p_user_id: userId
      });

      if (error) {
        logger.error('Error fetching user profile with roles:', error);
        return null;
      }

      // Cache the result
      const typedData = data as unknown as UserProfileWithRoles;
      profileCache.set(userId, { data: typedData, timestamp: Date.now() });
      return typedData;
    } catch (err) {
      logger.error('Exception fetching user profile:', err);
      return null;
    }
  }, []);

  // Create enhanced user from profile data
  const createEnhancedUser = useCallback((supabaseUser: SupabaseUser, profileData: UserProfileWithRoles): User => {
    const profile = profileData?.profile;
    const roles = profileData?.roles || ['tenant'];
    const vendorProfile = profileData?.vendor_profile;

    let vendorData = null;
    let subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise' = 'free';

    if (roles.includes('vendor') && vendorProfile) {
      vendorData = {
        isVerified: vendorProfile.is_verified || false,
        companyName: vendorProfile.company_name,
        avatarUrl: vendorProfile.avatar_url || profile?.avatar_url,
        specialties: [],
        rating: vendorProfile.rating || 0,
        completedJobs: 0,
        responseTime: '2 hours',
        certifications: [],
        insurance: false,
        backgroundCheck: false
      };
      
      if (typeof vendorProfile.subscription_plan === 'string') {
        const allowedPlans = ['free', 'basic', 'premium', 'enterprise'] as const;
        const plan = vendorProfile.subscription_plan;
        if ((allowedPlans as readonly string[]).includes(plan)) {
          subscriptionPlan = plan as typeof subscriptionPlan;
        }
      }
      
      if (vendorProfile.is_verified && subscriptionPlan === 'free') {
        subscriptionPlan = 'premium';
      }
    }

    const avatarUrl = (roles.includes('vendor') && vendorData?.avatarUrl) 
      ? vendorData.avatarUrl 
      : profile?.avatar_url;

    const primaryRole = roles.includes('admin') ? 'admin' 
      : roles.includes('property_manager') ? 'property_manager'
      : roles.includes('vendor') ? 'vendor' 
      : 'tenant';

    return {
      ...supabaseUser,
      name: profile?.full_name || supabaseUser.email?.split('@')[0] || '',
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      role: primaryRole as UserRole,
      avatar_url: avatarUrl,
      lastLogin: new Date().toISOString(),
      vendor: vendorData,
      subscription: {
        plan: subscriptionPlan,
        status: subscriptionPlan !== 'free' ? 'active' : 'inactive',
        features: [],
        expiresAt: subscriptionPlan !== 'free' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
          : undefined
      },
      properties: [],
      permissions: roles.includes('admin') ? ['*'] : []
    } as User;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(initialSession);

        if (initialSession?.user) {
          const profileData = await fetchUserProfileWithRoles(initialSession.user.id);
          
          if (isMounted && profileData) {
            const roles = Array.isArray(profileData.roles) 
              ? profileData.roles 
              : [profileData.roles || 'tenant'];
            
            const enhancedUser = createEnhancedUser(initialSession.user, profileData);
            setUser(enhancedUser);
            setUserRoles(roles);
          }
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setUserRoles([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initialLoadDone.current = true;
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRoles([]);
        profileCache.clear();
        return;
      }

      if (newSession?.user && initialLoadDone.current) {
        // Invalidate cache on sign in or token refresh
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          profileCache.delete(newSession.user.id);
        }

        const profileData = await fetchUserProfileWithRoles(newSession.user.id);
        
        if (isMounted && profileData) {
          const roles = Array.isArray(profileData.roles) 
            ? profileData.roles 
            : [profileData.roles || 'tenant'];
          
          const enhancedUser = createEnhancedUser(newSession.user, profileData);
          setUser(enhancedUser);
          setUserRoles(roles);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfileWithRoles, createEnhancedUser]);

  const signUp = async (email: string, password: string, userData: Record<string, unknown> = {}) => {    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      // Apply rate limiting to signup
      const { error } = await withRateLimit('auth/signup', async () => {
        return supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: userData
          }
        });
      }, { throwOnLimit: false }).catch((rateLimitError) => {
        if (rateLimitError.code === 'RATE_LIMIT_EXCEEDED') {
          toast.error('Too many signup attempts. Please try again in a few minutes.');
          return { error: rateLimitError };
        }
        throw rateLimitError;
      });

      if (error) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
          return { error };
        }
        if (error.message?.includes('User already registered')) {
          toast.error('An account with this email already exists.');
        } else if (error.message?.includes('Password should be')) {
          toast.error('Password must be at least 6 characters long.');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        return { error };
      }

      toast.success('Account created! Please check your email for verification.');
      return { error: null };
    } catch (error: unknown) {
      toast.error('An unexpected error occurred during signup');
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Apply rate limiting to sign in
      const { error } = await withRateLimit('auth/signin', async () => {
        return supabase.auth.signInWithPassword({ email, password });
      }, { throwOnLimit: false }).catch((rateLimitError) => {
        if (rateLimitError.code === 'RATE_LIMIT_EXCEEDED') {
          toast.error('Too many login attempts. Please try again in 5 minutes.');
          return { error: rateLimitError };
        }
        throw rateLimitError;
      });

      if (error) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
          return { error };
        }
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid email or password.');
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error('Please confirm your email before signing in.');
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
        return { error };
      }

      toast.success('Signed in successfully!');
      return { error: null };
    } catch (error: unknown) {
      toast.error('An unexpected error occurred during sign in');
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Error signing out');
      } else {
        setUser(null);
        setUserRoles([]);
        profileCache.clear();
        toast.success('Signed out successfully');
      }
    } catch (error: unknown) {
      toast.error('An unexpected error occurred during sign out');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Client-side role check for UI visibility only.
   * 
   * SECURITY NOTE: This function is for UI/UX purposes ONLY.
   * It controls what users see in the interface, NOT what they can access.
   * 
   * All actual authorization is enforced server-side via:
   * - Supabase RLS policies using is_admin_user() and user_roles table
   * - Edge function authentication checks
   * - Database-level security definer functions
   * 
   * An attacker bypassing these UI checks will still be blocked by RLS policies.
   * See: is_admin_user(), user_has_role(), has_role() SQL functions
   */
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!userRoles.length) return false;
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    return userRoles.includes(role);
  }, [userRoles]);

  /**
   * Client-side permission check for UI visibility only.
   * 
   * SECURITY NOTE: This is a UI hint, not a security control.
   * Backend RLS policies enforce actual data access restrictions.
   * All Supabase tables have proper RLS using is_admin_user() checks.
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return hasRole(['admin', 'property_manager']);
  }, [hasRole]);

  const isSubscribed = useCallback((tier: string): boolean => {
    if (!user) return false;
    if (hasRole(['admin', 'property_manager'])) return true;
    if (hasRole('vendor')) {
      return tier === 'basic' || tier === 'premium' || tier === 'enterprise';
    }
    return false;
  }, [user, hasRole]);

  const updateProfile = async (updates: Record<string, unknown>) => {
    try {
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate cache
      profileCache.delete(user.id);
      
      toast.success('Profile updated successfully');
      return { error: null };
    } catch (error: unknown) {
      toast.error('Failed to update profile');
      return { error: error as AuthError };
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      // Invalidate cache
      profileCache.delete(user.id);
      
      const profileData = await fetchUserProfileWithRoles(user.id);
      if (profileData) {
        const roles = Array.isArray(profileData.roles) 
          ? profileData.roles 
          : [profileData.roles || 'tenant'];
        
        const enhancedUser = createEnhancedUser(user, profileData);
        setUser(enhancedUser);
        setUserRoles(roles);
      }
    } catch (error) {
      logger.error('Error refreshing user data:', error);
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
      
      // Invalidate cache and update local state
      profileCache.delete(user.id);
      setUser(prev => prev ? { ...prev, ...userData } : prev);
      toast.success('Profile updated successfully');
    } catch (error) {
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
    logout: signOut,
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
