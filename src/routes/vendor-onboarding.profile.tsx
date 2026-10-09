import { createFileRoute } from "@tanstack/react-router";
import OnboardingLayout from "@/pages/vendor-onboarding/OnboardingLayout";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import ProfileStep from "@/pages/vendor-onboarding/ProfileStep";

export const Route = createFileRoute("/vendor-onboarding/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <OnboardingLayout>
      <ProfileStep />
      </OnboardingLayout>
      </OptimizedProtectedRoute>
  );
}
