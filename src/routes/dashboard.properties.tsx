import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import Properties from "@/pages/Properties";

export const Route = createFileRoute("/dashboard/properties")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <Properties />
      </OptimizedProtectedRoute>
  );
}
