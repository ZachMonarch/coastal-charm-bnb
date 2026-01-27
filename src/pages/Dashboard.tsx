import { useEffect, useState } from "react";
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
  const { hasRole, isLoading: authLoading, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { 
    existingRequest, 
    hasPendingRequest, 
    hasApprovedRequest,
    hasRejectedRequest,
    isLoading: accessLoading,
    fetchExistingRequest
  } = useAccessRequest();

  const [accessCheckComplete, setAccessCheckComplete] = useState(false);
  const isLoading = authLoading || accessLoading;

  // Determine if user has a proper role (admin, vendor, or property_manager)
  const hasFullAccess = hasRole('admin') || hasRole('vendor') || hasRole('property_manager');
  const isAdmin = hasRole('admin');

  // Force fresh access check on mount
  useEffect(() => {
    const checkAccess = async () => {
      if (refreshUser) {
        await refreshUser();
      }
      if (fetchExistingRequest) {
        await fetchExistingRequest();
      }
      setAccessCheckComplete(true);
    };
    checkAccess();
  }, [refreshUser, fetchExistingRequest]);

  // Redirect vendors to their dedicated dashboard
  useEffect(() => {
    if (!isLoading && accessCheckComplete && hasRole('vendor') && !isAdmin) {
      navigate('/vendor', { replace: true });
    }
  }, [hasRole, isLoading, navigate, accessCheckComplete, isAdmin]);

  // Handle approved requests - redirect immediately based on approved role
  useEffect(() => {
    if (!isLoading && accessCheckComplete && hasApprovedRequest && existingRequest?.role_requested) {
      // User has an approved request but auth context may not have refreshed yet
      // Force redirect to appropriate dashboard
      if (existingRequest.role_requested === 'vendor') {
        navigate('/vendor', { replace: true });
      }
    }
  }, [isLoading, hasApprovedRequest, existingRequest, navigate, accessCheckComplete]);

  // Show loading state while checking access
  if (!accessCheckComplete || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoadingSpinner />;
  }

  // CRITICAL: Admin bypass - admins never see access gates
  if (isAdmin) {
    return (
      <DashboardShell user={user}>
        <div className="space-y-6">
          <QuickActions />
          <EnhancedRoleBasedDashboard />
        </div>
      </DashboardShell>
    );
  }

  // If user has full access or has an approved request - show appropriate dashboard
  if (hasFullAccess || hasApprovedRequest) {
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
