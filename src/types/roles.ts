/**
 * Application Role Types and Scope Definitions
 * 
 * Defines the role hierarchy and permission scopes for the application.
 * These roles map to Supabase RLS policies and user_roles table.
 */

export type AppRole = 'authenticated' | 'admin' | 'vendor' | 'tenant' | 'property_manager';

/**
 * Role-based permission scopes
 * Each role has specific capabilities defined by scope strings
 */
export const RoleScopes = {
  admin: ['*' as const], // Full system access
  property_manager: [
    'projects:read',
    'projects:write',
    'properties:read',
    'properties:write',
    'tenants:read',
    'tenants:write',
    'messages:room'
  ],
  vendor: [
    'projects:read',
    'projects:write:self',
    'applications:read:self',
    'applications:write:self',
    'contracts:read:self',
    'payments:read:self',
    'messages:room'
  ],
  tenant: [
    'leases:read:self',
    'tickets:write:self',
    'payments:read:self',
    'messages:room'
  ],
  authenticated: [
    'profile:read:self',
    'profile:write:self'
  ]
} as const;

/**
 * Type guard to check if a value is a valid AppRole
 */
export function isValidRole(role: string): role is AppRole {
  return ['authenticated', 'admin', 'vendor', 'tenant', 'property_manager'].includes(role);
}

/**
 * Check if a role has a specific scope
 */
export function hasScope(role: AppRole, scope: string): boolean {
  const scopes = RoleScopes[role] as readonly string[];
  return (scopes as readonly string[]).includes('*') || scopes.includes(scope);
}

/**
 * Get all scopes for a role
 */
export function getRoleScopes(role: AppRole): readonly string[] {
  return RoleScopes[role];
}

