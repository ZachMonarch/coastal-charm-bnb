import { createFileRoute } from "@tanstack/react-router";
import AdminEMDLedger from "@/pages/admin/AdminEMDLedger";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/emd")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminEMDLedger />
      </OptimizedProtectedRoute>
  );
}
