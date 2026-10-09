import { createFileRoute } from "@tanstack/react-router";
import CompleteStep from "@/pages/vendor-onboarding/CompleteStep";
import OnboardingLayout from "@/pages/vendor-onboarding/OnboardingLayout";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/vendor-onboarding/complete")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <OnboardingLayout>
      <CompleteStep />
      </OnboardingLayout>
      </OptimizedProtectedRoute>
  );
}
