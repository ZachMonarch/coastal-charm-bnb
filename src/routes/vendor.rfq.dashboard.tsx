import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorRFQDashboard from "@/pages/vendor/VendorRFQDashboard";

export const Route = createFileRoute("/vendor/rfq/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorRFQDashboard />
      </OptimizedProtectedRoute>
  );
}
