import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import RFQManagement from "@/pages/admin/UnifiedRFQManagement";

export const Route = createFileRoute("/admin/rfq/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <RFQManagement />
      </OptimizedProtectedRoute>
  );
}
