import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import SalesIQAdmin from "@/pages/admin/SalesIQAdmin";

export const Route = createFileRoute("/admin/salesiq")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <SalesIQAdmin />
      </OptimizedProtectedRoute>
  );
}
