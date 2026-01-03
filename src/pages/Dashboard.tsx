import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useAccessRequest } from "@/hooks/useAccessRequest";
import { AccessGateOverlay } from "@/components/access/AccessGateOverlay";
import { PendingApprovalView } from "@/components/access/PendingApprovalView";
import DashboardShell from "@/components/layout/DashboardShell";
import EnhancedRoleBasedDashboard from "@/components/EnhancedRoleBasedDashboard";
import QuickActions from "@/components/QuickActions";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Dashboard() {
  const { hasRole, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const { 
    existingRequest, 
    hasPendingRequest, 
    hasApprovedRequest,
    hasRejectedRequest,
    isLoading: accessLoading 
  } = useAccessRequest();

  const isLoading = authLoading || accessLoading;

  // Determine if user has a proper role (admin, vendor, or property_manager)
  const hasFullAccess = hasRole('admin') || hasRole('vendor') || hasRole('property_manager');

  // Redirect vendors to their dedicated dashboard
  useEffect(() => {
    if (!isLoading && hasRole('vendor')) {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [hasRole, isLoading, navigate]);

  // Handle approved requests - redirect immediately based on approved role
  useEffect(() => {
    if (!isLoading && hasApprovedRequest && existingRequest?.role_requested) {
      // User has an approved request but auth context may not have refreshed yet
      // Force redirect to appropriate dashboard
      if (existingRequest.role_requested === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else if (existingRequest.role_requested === 'property_manager') {
        // Stay on dashboard for property managers, but ensure we don't show pending view
        return;
      }
    }
  }, [isLoading, hasApprovedRequest, existingRequest, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoadingSpinner />;
  }

  // If user has full access or has an approved request - show appropriate dashboard
  // The approved check handles race condition where auth context hasn't refreshed yet
  if (hasFullAccess || hasApprovedRequest) {
    // Vendors are already redirected above
    return (
      <DashboardShell user={user}>
        <div className="space-y-6">
          <QuickActions />
          <EnhancedRoleBasedDashboard />
        </div>
      </DashboardShell>
    );
  }

  // If user has no full access and has a pending or rejected request - show pending view
  if (existingRequest && (hasPendingRequest || hasRejectedRequest)) {
    return <PendingApprovalView />;
  }

  // If user has no full access role and no existing request - show access gate overlay
  return <AccessGateOverlay />;
}
