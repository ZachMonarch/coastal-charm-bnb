import { createFileRoute } from "@tanstack/react-router";
import CapabilitiesStep from "@/pages/vendor-onboarding/CapabilitiesStep";
import OnboardingLayout from "@/pages/vendor-onboarding/OnboardingLayout";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/vendor-onboarding/capabilities")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <OnboardingLayout>
      <CapabilitiesStep />
      </OnboardingLayout>
      </OptimizedProtectedRoute>
  );
}
