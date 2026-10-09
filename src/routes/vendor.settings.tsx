import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import UnifiedSettings from "@/pages/UnifiedSettings";

export const Route = createFileRoute("/vendor/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <UnifiedSettings />
      </OptimizedProtectedRoute>
  );
}
