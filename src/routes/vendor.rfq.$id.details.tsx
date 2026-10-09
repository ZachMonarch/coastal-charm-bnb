import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import RFQProjectDetail from "@/pages/RFQProjectDetail";

export const Route = createFileRoute("/vendor/rfq/$id/details")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute>
      <RFQProjectDetail />
      </OptimizedProtectedRoute>
  );
}
