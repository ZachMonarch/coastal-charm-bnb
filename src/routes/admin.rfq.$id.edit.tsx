import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import RFQEdit from "@/pages/admin/RFQEdit";

export const Route = createFileRoute("/admin/rfq/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <RFQEdit />
      </OptimizedProtectedRoute>
  );
}
