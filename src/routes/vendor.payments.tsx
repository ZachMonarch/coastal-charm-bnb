import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorPayments from "@/pages/VendorPayments";

export const Route = createFileRoute("/vendor/payments")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorPayments />
      </OptimizedProtectedRoute>
  );
}
