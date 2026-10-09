import { createFileRoute } from "@tanstack/react-router";
import AdminTesting from "@/pages/AdminTesting";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/testing")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminTesting />
      </OptimizedProtectedRoute>
  );
}
