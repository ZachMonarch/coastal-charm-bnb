import { createFileRoute } from "@tanstack/react-router";
import AuthDebug from "@/pages/AuthDebug";

export const Route = createFileRoute("/auth-debug")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthDebug />
  );
}
