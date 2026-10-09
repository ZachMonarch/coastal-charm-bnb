import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorProjectDetails from "@/pages/VendorProjectDetails";

export const Route = createFileRoute("/vendor/projects/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorProjectDetails />
      </OptimizedProtectedRoute>
  );
}
