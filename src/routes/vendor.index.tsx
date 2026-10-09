import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorDashboard from "@/pages/VendorDashboard";

export const Route = createFileRoute("/vendor/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorDashboard />
      </OptimizedProtectedRoute>
  );
}
