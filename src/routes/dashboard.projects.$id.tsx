import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import ProjectDetails from "@/pages/ProjectDetails";

export const Route = createFileRoute("/dashboard/projects/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <ProjectDetails />
      </OptimizedProtectedRoute>
  );
}
