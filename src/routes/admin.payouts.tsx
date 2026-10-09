import { createFileRoute } from "@tanstack/react-router";
import AdminPayoutProcessing from "@/pages/admin/AdminPayoutProcessing";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/payouts")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <AdminPayoutProcessing />
      </OptimizedProtectedRoute>
  );
}
