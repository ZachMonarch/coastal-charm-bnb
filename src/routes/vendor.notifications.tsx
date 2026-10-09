import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorNotifications from "@/pages/vendor/VendorNotifications";

export const Route = createFileRoute("/vendor/notifications")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorNotifications />
      </OptimizedProtectedRoute>
  );
}
