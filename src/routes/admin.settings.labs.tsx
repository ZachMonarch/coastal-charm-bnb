import { createFileRoute } from "@tanstack/react-router";
import AdminLabs from "@/pages/AdminLabs";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/settings/labs")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminLabs />
      </OptimizedProtectedRoute>
  );
}
