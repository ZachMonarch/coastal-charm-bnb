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
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border-primary/40 text-foreground hover:text-primary hover:border-primary">
          <Link to="/auth">Sign In</Link>
        </Button>
        <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-semibold shadow-md !text-white">
          <Link to="/auth?tab=signup" className="whitespace-nowrap !text-white">Join Now</Link>
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
          className="relative h-8 w-8 rounded-full border border-primary/20 min-h-[44px] min-w-[44px] hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
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
      <DropdownMenuContent className="w-64 sm:w-56 bg-popover border border-border shadow-2xl z-[200]" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-3">
          <div className="flex items-center gap-3">
            <ReusableAvatar 
              url={avatarUrl}
              name={displayName}
              size="md"
              variant={hasRole('vendor') ? 'vendor' : 'user'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Badge className={`${getRoleBadgeColor(userRole)} text-xs capitalize`}>
              {userRole.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to={hasRole('vendor') ? "/vendor/dashboard" : "/dashboard"} className="flex items-center px-3 py-2 hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-colors">
            <User className="mr-3 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        
        {hasRole('vendor') && (
          <DropdownMenuItem asChild>
            <Link to="/vendor/profile" className="flex items-center px-3 py-2 hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-colors">
              <User className="mr-3 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center px-3 py-2 hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-colors">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        {hasRole('admin') && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center px-3 py-2 hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-colors">
              <Settings className="mr-3 h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/10 px-3 py-2 transition-colors">
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}