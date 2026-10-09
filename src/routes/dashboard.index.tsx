import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute>
      <Dashboard />
      </OptimizedProtectedRoute>
  );
}
