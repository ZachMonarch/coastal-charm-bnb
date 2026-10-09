import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorRFQ from "@/pages/VendorRFQ";

export const Route = createFileRoute("/vendor/rfq/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorRFQ />
      </OptimizedProtectedRoute>
  );
}
