import { createFileRoute } from "@tanstack/react-router";
import AdminManagementSystem from "@/components/AdminManagementSystem";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminManagementSystem />
      </OptimizedProtectedRoute>
  );
}
