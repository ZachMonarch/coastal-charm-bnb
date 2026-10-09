import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorLeads from "@/pages/vendor/VendorLeads";

export const Route = createFileRoute("/vendor/leads")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorLeads />
      </OptimizedProtectedRoute>
  );
}
