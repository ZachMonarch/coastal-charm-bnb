import { createFileRoute } from "@tanstack/react-router";
import LoginBridge from "@/pages/auth/LoginBridge";

export const Route = createFileRoute("/login-bridge")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <LoginBridge />
  );
}
