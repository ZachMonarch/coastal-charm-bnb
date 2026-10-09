import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorRFQDetail from "@/pages/vendor/ComprehensiveRFQDetail";

export const Route = createFileRoute("/vendor/rfqs/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorRFQDetail />
      </OptimizedProtectedRoute>
  );
}
