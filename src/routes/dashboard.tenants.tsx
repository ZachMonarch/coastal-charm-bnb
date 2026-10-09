import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import TenantManagement from "@/pages/TenantManagement";

export const Route = createFileRoute("/dashboard/tenants")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <TenantManagement />
      </OptimizedProtectedRoute>
  );
}
