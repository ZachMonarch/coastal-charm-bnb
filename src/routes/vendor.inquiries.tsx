import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorInquiries from "@/pages/vendor/VendorInquiries";

export const Route = createFileRoute("/vendor/inquiries")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <VendorInquiries />
      </OptimizedProtectedRoute>
  );
}
