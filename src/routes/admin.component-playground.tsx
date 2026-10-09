import { createFileRoute } from "@tanstack/react-router";
import ComponentPlayground from "@/pages/admin/ComponentPlayground";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/component-playground")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <ComponentPlayground />
      </OptimizedProtectedRoute>
  );
}
