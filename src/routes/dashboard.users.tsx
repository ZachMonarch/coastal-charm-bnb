import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import UserManagement from "@/pages/UserManagement";

export const Route = createFileRoute("/dashboard/users")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <UserManagement />
      </OptimizedProtectedRoute>
  );
}
