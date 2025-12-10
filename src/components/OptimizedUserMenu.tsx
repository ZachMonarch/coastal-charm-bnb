import React from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bell, User, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ReusableAvatar from './Avatar';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { getRoleBadgeColor } from '@/utils/themeColors';
import { logger } from '@/utils/logger';

export default function OptimizedUserMenu() {
  const { user, signOut, isAuthenticated, getUserRole, hasRole } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link to="/auth">Sign In</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/auth?tab=signup" className="whitespace-nowrap">Join Now</Link>
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      // Clear local auth state first
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      logger.error('Logout error:', error);
      navigate('/auth', { replace: true });
    }
  };


  // Get user display data with proper fallbacks
  const userData = user.user_metadata || {};
  const displayName = user.vendor?.companyName || userData.full_name || userData.first_name || user.email?.split('@')[0] || 'User';
  const userRole = getUserRole();
  // Fix avatar URL - check profiles table first, then vendor, then metadata
  const avatarUrl = user.avatar_url || user.vendor?.avatarUrl || userData.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-11 w-11 rounded-full border-2 border-primary/30 min-h-[44px] min-w-[44px] hover:border-primary/60 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all shadow-md bg-muted"
          aria-label="Open user menu"
        >
          <ReusableAvatar 
            url={avatarUrl}
            name={displayName}
            size="sm"
            variant={hasRole('vendor') ? 'vendor' : 'user'}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 bg-popover border-2 border-border shadow-2xl z-[500] rounded-xl overflow-hidden" align="end" forceMount>
        {/* User Header Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="ring-2 ring-primary/30 rounded-full">
              <ReusableAvatar 
                url={avatarUrl}
                name={displayName}
                size="md"
                variant={hasRole('vendor') ? 'vendor' : 'user'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-popover-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
              <Badge className={`${getRoleBadgeColor(userRole)} text-xs capitalize mt-2`}>
                {userRole.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="p-2">
          <DropdownMenuItem asChild>
            <Link to={hasRole('vendor') ? "/vendor/dashboard" : "/dashboard"} className="flex items-center px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors text-popover-foreground">
              <User className="mr-3 h-4 w-4 text-primary" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          {hasRole('vendor') && (
            <DropdownMenuItem asChild>
              <Link to="/vendor/profile" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors text-popover-foreground">
                <User className="mr-3 h-4 w-4 text-primary" />
                <span className="font-medium">Profile</span>
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors text-popover-foreground">
              <Settings className="mr-3 h-4 w-4 text-primary" />
              <span className="font-medium">Settings</span>
            </Link>
          </DropdownMenuItem>
          
          {hasRole('admin') && (
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors text-popover-foreground">
                <Settings className="mr-3 h-4 w-4 text-primary" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </div>
        
        <DropdownMenuSeparator className="bg-border" />
        
        {/* Sign Out */}
        <div className="p-2">
          <DropdownMenuItem onClick={handleLogout} className="flex items-center px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors cursor-pointer">
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}