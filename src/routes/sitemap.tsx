import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import Sitemap from "@/pages/Sitemap";

export const Route = createFileRoute("/sitemap")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <Sitemap />
      </OptimizedProtectedRoute>
  );
}
