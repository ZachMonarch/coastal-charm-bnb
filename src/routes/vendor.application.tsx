import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorApplication from "@/pages/VendorApplication";

export const Route = createFileRoute("/vendor/application")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorApplication />
      </OptimizedProtectedRoute>
  );
}
