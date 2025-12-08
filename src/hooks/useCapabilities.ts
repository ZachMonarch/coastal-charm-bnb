import { useMemo } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';

/**
 * Server-driven capability hook for role-based UI rendering
 * Replaces scattered hasRole() checks with normalized capabilities
 */
export interface UserCapabilities {
  canViewAdminPanel: boolean;
  canManageUsers: boolean;
  canManageVendors: boolean;
  canManageProjects: boolean;
  canManageProperties: boolean;
  canViewReports: boolean;
  canManagePayments: boolean;
  canAccessVendorDashboard: boolean;
  canBidOnProjects: boolean;
  canViewTenantPortal: boolean;
  canMakeBookings: boolean;
}

export const useCapabilities = (): UserCapabilities => {
  const { hasRole } = useAuth();

  return useMemo(() => ({
    // Admin capabilities
    canViewAdminPanel: hasRole('admin'),
    canManageUsers: hasRole('admin'),
    canManageVendors: hasRole(['admin', 'property_manager']),
    canManageProjects: hasRole(['admin', 'property_manager']),
    canManageProperties: hasRole(['admin', 'property_manager']),
    canViewReports: hasRole(['admin', 'property_manager']),
    canManagePayments: hasRole('admin'),
    
    // Vendor capabilities
    canAccessVendorDashboard: hasRole('vendor'),
    canBidOnProjects: hasRole('vendor'),
    
    // Tenant capabilities
    canViewTenantPortal: hasRole('tenant'),
    canMakeBookings: hasRole('tenant'),
  }), [hasRole]);
};
