/**
 * Role Display Utility
 * 
 * Provides consistent role display across the application.
 * Shows the user's intended role (e.g., "Vendor") even when pending approval,
 * instead of confusing users by showing "Tenant".
 */

export interface RoleDisplayResult {
  label: string;
  displayLabel: string;
  isPending: boolean;
  isApproved: boolean;
}

/**
 * Get the display-friendly role for a user.
 * 
 * When a user has submitted a vendor/property_manager request,
 * we show their INTENDED role with a "Pending" indicator,
 * NOT their temporary "tenant" assignment.
 * 
 * @param actualRole - The user's current role from user_roles table
 * @param hasPendingRequest - Whether the user has a pending access request
 * @param requestedRole - The role they requested (vendor, property_manager)
 * @returns Display information for the role
 */
export function getDisplayRole(
  actualRole: string,
  hasPendingRequest: boolean = false,
  requestedRole?: string
): RoleDisplayResult {
  // Format role for display (replace underscores with spaces, capitalize)
  const formatRole = (role: string): string => {
    return role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  // If user has a pending request, show their intended role
  if (hasPendingRequest && requestedRole) {
    return {
      label: requestedRole,
      displayLabel: formatRole(requestedRole),
      isPending: true,
      isApproved: false
    };
  }

  // Otherwise show their actual assigned role
  return {
    label: actualRole,
    displayLabel: formatRole(actualRole),
    isPending: false,
    isApproved: actualRole !== 'tenant'
  };
}

/**
 * Get a short badge label for compact UI elements
 */
export function getRoleBadgeLabel(
  hasPendingRequest: boolean,
  requestedRole?: string,
  actualRole: string = 'tenant'
): string {
  if (hasPendingRequest && requestedRole) {
    return requestedRole.replace(/_/g, ' ');
  }
  return actualRole.replace(/_/g, ' ');
}
