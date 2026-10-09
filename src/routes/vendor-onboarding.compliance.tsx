import { createFileRoute } from "@tanstack/react-router";
import ComplianceStep from "@/pages/vendor-onboarding/ComplianceStep";
import OnboardingLayout from "@/pages/vendor-onboarding/OnboardingLayout";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/vendor-onboarding/compliance")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <OnboardingLayout>
      <ComplianceStep />
      </OnboardingLayout>
      </OptimizedProtectedRoute>
  );
}
