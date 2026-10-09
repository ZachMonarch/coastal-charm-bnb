import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorContractDetails from "@/pages/VendorContractDetails";

export const Route = createFileRoute("/vendor/contracts/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorContractDetails />
      </OptimizedProtectedRoute>
  );
}
