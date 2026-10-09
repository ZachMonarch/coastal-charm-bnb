import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import WorkOrders from "@/pages/admin/WorkOrders";

export const Route = createFileRoute("/admin/work-orders")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <WorkOrders />
      </OptimizedProtectedRoute>
  );
}
