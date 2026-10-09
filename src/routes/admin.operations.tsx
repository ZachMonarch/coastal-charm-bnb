import { createFileRoute } from "@tanstack/react-router";
import AdminControlSuite from "@/pages/AdminControlSuite";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/operations")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminControlSuite />
      </OptimizedProtectedRoute>
  );
}
