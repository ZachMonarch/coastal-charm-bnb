import { UserRole } from '@/contexts/OptimizedAuthContext';

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  admin: '/admin',
  property_manager: '/dashboard/projects',
  vendor: '/vendor/dashboard',
  tenant: '/dashboard',
};

export const getRoleHomeRoute = (role: UserRole): string => {
  return ROLE_HOME_ROUTES[role] || '/dashboard';
};

export const getRoleHomeRouteForRoles = (roles: UserRole[]): string => {
  // Priority: admin > property_manager > vendor > tenant
  const rolePriority: UserRole[] = ['admin', 'property_manager', 'vendor', 'tenant'];
  
  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return ROLE_HOME_ROUTES[role];
    }
  }
  
  return '/dashboard';
};
