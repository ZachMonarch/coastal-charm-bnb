import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorContracts from "@/pages/VendorContracts";

export const Route = createFileRoute("/vendor/contracts/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorContracts />
      </OptimizedProtectedRoute>
  );
}
