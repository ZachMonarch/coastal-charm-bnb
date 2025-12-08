import VendorOnboardingFlow from "@/components/VendorOnboardingFlow";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function VendorOnboarding() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <PrivatePageWrapper title="Vendor Onboarding">
        <VendorOnboardingFlow />
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}