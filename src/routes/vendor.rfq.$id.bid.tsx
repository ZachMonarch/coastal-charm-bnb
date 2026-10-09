import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import RFQBidSubmission from "@/pages/RFQBidSubmission";

export const Route = createFileRoute("/vendor/rfq/$id/bid")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <RFQBidSubmission />
      </OptimizedProtectedRoute>
  );
}
