import VendorDashboardComplete from "@/components/VendorDashboardComplete";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function VendorDashboard() {
  const { user, isSubscribed } = useAuth();

  // Simplified access check - allow all vendors to access dashboard
  // Subscription status controls feature availability, not dashboard access
  const canApplyToProjects = isSubscribed('basic');
  const canViewAllProjects = isSubscribed('premium');

  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <PrivatePageWrapper title="Vendor Dashboard">
        <VendorDashboardComplete 
          canApply={canApplyToProjects} 
          canViewAll={canViewAllProjects}
        />
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}