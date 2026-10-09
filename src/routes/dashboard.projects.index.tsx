import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import ProjectManagement from "@/pages/ProjectManagement";

export const Route = createFileRoute("/dashboard/projects/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <ProjectManagement />
      </OptimizedProtectedRoute>
  );
}
