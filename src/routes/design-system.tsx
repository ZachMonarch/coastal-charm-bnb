import { createFileRoute } from "@tanstack/react-router";
import DesignSystemShowcase from "@/pages/DesignSystemShowcase";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/design-system")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <DesignSystemShowcase />
      </OptimizedProtectedRoute>
  );
}
