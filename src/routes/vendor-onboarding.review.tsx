import { createFileRoute } from "@tanstack/react-router";
import OnboardingLayout from "@/pages/vendor-onboarding/OnboardingLayout";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import ReviewStep from "@/pages/vendor-onboarding/ReviewStep";

export const Route = createFileRoute("/vendor-onboarding/review")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <OnboardingLayout>
      <ReviewStep />
      </OnboardingLayout>
      </OptimizedProtectedRoute>
  );
}
