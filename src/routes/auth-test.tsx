import { createFileRoute } from "@tanstack/react-router";
import AuthTest from "@/pages/AuthTest";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import NotFound from "@/pages/NotFound";

export const Route = createFileRoute("/auth-test")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    import.meta.env.DEV ? (
      <OptimizedProtectedRoute requiredRole="admin">
      <AuthTest />
      </OptimizedProtectedRoute>
    ) : (
      <NotFound />
    )
  );
}
