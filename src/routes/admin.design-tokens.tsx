import { createFileRoute } from "@tanstack/react-router";
import DesignTokens from "@/pages/admin/DesignTokens";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/design-tokens")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <DesignTokens />
      </OptimizedProtectedRoute>
  );
}
