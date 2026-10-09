import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import ThemePreview from "@/pages/ThemePreview";

export const Route = createFileRoute("/theme-preview")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <ThemePreview />
      </OptimizedProtectedRoute>
  );
}
