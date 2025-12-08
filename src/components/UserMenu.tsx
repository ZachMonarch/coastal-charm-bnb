import React from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bell, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ReusableAvatar from './Avatar';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { getRoleBadgeColor } from '@/utils/themeColors';

export default function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();
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
      
      await logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/auth', { replace: true });
    }
  };


  // Get user display data safely
  const userData = user.user_metadata || {};
  const displayName = userData.full_name || userData.first_name || user.email?.split('@')[0] || 'User';
  const userRole = userData.role || 'tenant';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full border border-border/20"
          aria-label="Open user menu"
        >
          <ReusableAvatar 
            url={userData.avatar_url}
            name={displayName}
            size="sm"
            variant="user"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64 sm:w-56 bg-popover z-50" 
        align="end" 
        forceMount
        role="menu"
      >
        <div className="flex flex-col space-y-1 p-3">
          <div className="flex items-center gap-3">
            <ReusableAvatar 
              url={userData.avatar_url}
              name={displayName}
              size="md"
              variant="user"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
          <Link to="/dashboard" className="flex items-center px-3 py-2">
            <User className="mr-3 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/dashboard/profile" className="flex items-center px-3 py-2">
            <User className="mr-3 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings" className="flex items-center px-3 py-2">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        {userRole === 'admin' && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center px-3 py-2">
              <Settings className="mr-3 h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-destructive px-3 py-2">
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}