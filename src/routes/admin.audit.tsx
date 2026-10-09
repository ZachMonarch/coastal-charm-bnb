import { createFileRoute } from "@tanstack/react-router";
import AdminAuditLog from "@/pages/AdminAuditLog";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/audit")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminAuditLog />
      </OptimizedProtectedRoute>
  );
}
