import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorPayouts from "@/pages/vendor/VendorPayouts";

export const Route = createFileRoute("/vendor/payouts")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorPayouts />
      </OptimizedProtectedRoute>
  );
}
