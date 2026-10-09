import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorProjects from "@/pages/VendorProjects";

export const Route = createFileRoute("/vendor/projects/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorProjects />
      </OptimizedProtectedRoute>
  );
}
