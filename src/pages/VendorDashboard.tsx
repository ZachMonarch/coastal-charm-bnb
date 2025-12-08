import VendorDashboardComplete from "@/components/VendorDashboardComplete";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function VendorDashboard() {
  const { user, isSubscribed } = useAuth();

  const canApplyToProjects = user?.role === 'vendor' && isSubscribed('basic');
  const canViewAllProjects = user?.role === 'vendor' && isSubscribed('premium');

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