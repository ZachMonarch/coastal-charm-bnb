import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import TeamManagement from "@/pages/admin/TeamManagement";

export const Route = createFileRoute("/admin/team/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <TeamManagement />
      </OptimizedProtectedRoute>
  );
}
