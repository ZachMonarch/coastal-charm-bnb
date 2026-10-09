import { createFileRoute } from "@tanstack/react-router";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import TeamMemberProfile from "@/pages/admin/TeamMemberProfile";

export const Route = createFileRoute("/admin/team/$memberId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <TeamMemberProfile />
      </OptimizedProtectedRoute>
  );
}
