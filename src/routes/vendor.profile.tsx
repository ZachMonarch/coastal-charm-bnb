import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorProfile from "@/pages/VendorProfile";

export const Route = createFileRoute("/vendor/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorProfile />
      </OptimizedProtectedRoute>
  );
}
