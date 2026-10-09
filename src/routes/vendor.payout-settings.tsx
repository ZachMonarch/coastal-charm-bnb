import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorPayoutSettings from "@/pages/vendor/VendorPayoutSettings";

export const Route = createFileRoute("/vendor/payout-settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorPayoutSettings />
      </OptimizedProtectedRoute>
  );
}
