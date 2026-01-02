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

  // Redirect vendors to their dedicated dashboard
  useEffect(() => {
    if (!isLoading && hasRole('vendor')) {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [hasRole, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoadingSpinner />;
  }

  // Determine if user has a proper role (admin, vendor, or property_manager)
  const hasFullAccess = hasRole('admin') || hasRole('vendor') || hasRole('property_manager');

  // If user has no full access role and no existing request - show access gate overlay
  if (!hasFullAccess && !existingRequest) {
    return <AccessGateOverlay />;
  }

  // If user has a pending, approved (not yet refreshed), or rejected request - show pending view
  if (!hasFullAccess && existingRequest) {
    return <PendingApprovalView />;
  }

  // User has full access - show appropriate dashboard
  // Vendors are already redirected above, so this is for admin and property_manager
  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <QuickActions />
        <EnhancedRoleBasedDashboard />
      </div>
    </DashboardShell>
  );
}
