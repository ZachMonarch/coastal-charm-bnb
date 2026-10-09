import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorReports from "@/pages/VendorReports";

export const Route = createFileRoute("/vendor/reports")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorReports />
      </OptimizedProtectedRoute>
  );
}
