import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorProfileShowcase from "@/pages/vendor/VendorProfileShowcase";

export const Route = createFileRoute("/vendor/profile-showcase")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorProfileShowcase />
      </OptimizedProtectedRoute>
  );
}
