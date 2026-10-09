import { createFileRoute } from "@tanstack/react-router";
import AdminRFQAccessRequests from "@/pages/admin/AdminRFQAccessRequests";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/rfq-access")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <AdminRFQAccessRequests />
      </OptimizedProtectedRoute>
  );
}
