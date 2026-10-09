import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorMessages from "@/pages/vendor/VendorMessages";

export const Route = createFileRoute("/vendor/messages")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorMessages />
      </OptimizedProtectedRoute>
  );
}
