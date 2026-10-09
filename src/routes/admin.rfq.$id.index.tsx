import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import RFQDetail from "@/pages/admin/ComprehensiveRFQDetail";

export const Route = createFileRoute("/admin/rfq/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <RFQDetail />
      </OptimizedProtectedRoute>
  );
}
