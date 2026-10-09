import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorSubscription from "@/pages/VendorSubscription";

export const Route = createFileRoute("/vendor/subscription")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorSubscription />
      </OptimizedProtectedRoute>
  );
}
