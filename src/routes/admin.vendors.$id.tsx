import { createFileRoute } from "@tanstack/react-router";
import AdminVendorDetail from "@/pages/admin/AdminVendorDetail";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/vendors/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <AdminVendorDetail />
      </OptimizedProtectedRoute>
  );
}
