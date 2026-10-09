import { createFileRoute } from "@tanstack/react-router";
import CompanyStep from "@/pages/vendor-onboarding/CompanyStep";
import OnboardingLayout from "@/pages/vendor-onboarding/OnboardingLayout";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/vendor-onboarding/company")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <OnboardingLayout>
      <CompanyStep />
      </OnboardingLayout>
      </OptimizedProtectedRoute>
  );
}
