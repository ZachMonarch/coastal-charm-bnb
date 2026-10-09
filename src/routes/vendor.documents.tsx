import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorDocuments from "@/pages/VendorDocuments";

export const Route = createFileRoute("/vendor/documents")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorDocuments />
      </OptimizedProtectedRoute>
  );
}
