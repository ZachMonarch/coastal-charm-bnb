import { createFileRoute } from "@tanstack/react-router";
import AdminTenants from "@/pages/AdminTenants";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/tenants")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminTenants />
      </OptimizedProtectedRoute>
  );
}
