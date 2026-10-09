import { createFileRoute } from "@tanstack/react-router";
import CrossRFQBidAnalysis from "@/pages/admin/CrossRFQBidAnalysis";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";

export const Route = createFileRoute("/admin/bids")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <CrossRFQBidAnalysis />
      </OptimizedProtectedRoute>
  );
}
