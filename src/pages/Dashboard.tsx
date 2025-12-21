import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import DashboardShell from "@/components/layout/DashboardShell";
import EnhancedRoleBasedDashboard from "@/components/EnhancedRoleBasedDashboard";
import QuickActions from "@/components/QuickActions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { LimitedAccessBanner } from "@/components/LimitedAccessBanner";
import { AccessRequestForm } from "@/components/AccessRequestForm";
import { useAccessRequest } from "@/hooks/useAccessRequest";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Dashboard() {
  const { hasRole, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasLimitedAccess, hasPendingRequest } = useAccessRequest();
  
  const [showAccessDialog, setShowAccessDialog] = useState(false);

  // Check if user wants to request access via URL param
  useEffect(() => {
    if (searchParams.get('request-access') === 'true') {
      setShowAccessDialog(true);
      // Clean up URL
      searchParams.delete('request-access');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    // Redirect vendors to their dedicated dashboard
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

  // Check if user has only basic "authenticated" role (limited access)
  const userHasLimitedAccess = !hasRole('admin') && !hasRole('vendor') && !hasRole('property_manager');

  const kpis = [
    {
      label: "Earnings",
      value: "$101,490",
      icon: <DollarSign className="w-5 h-5" />,
      trend: { value: 12.5, direction: "up" as const },
      color: "success" as const,
    },
    {
      label: "Reservations",
      value: "1,490",
      icon: <Calendar className="w-5 h-5" />,
      color: "info" as const,
    },
    {
      label: "Check-ins",
      value: "1,490",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "teal" as const,
    },
    {
      label: "New Customers",
      value: "291",
      icon: <Users className="w-5 h-5" />,
      trend: { value: 8.2, direction: "up" as const },
      color: "primary" as const,
    },
  ];

  // Show generic dashboard for admin, property_manager, and tenant
  return (
    <>
      <DashboardShell user={user} kpis={kpis}>
        <div className="space-y-6">
          {/* Show limited access banner for users without full roles */}
          {userHasLimitedAccess && !hasPendingRequest && (
            <LimitedAccessBanner className="mb-4" />
          )}
          {userHasLimitedAccess && hasPendingRequest && (
            <LimitedAccessBanner className="mb-4" />
          )}
          
          <QuickActions />
          <EnhancedRoleBasedDashboard />
        </div>
      </DashboardShell>

      {/* Access Request Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Request Account Access</DialogTitle>
          </DialogHeader>
          <AccessRequestForm onSuccess={() => setShowAccessDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}