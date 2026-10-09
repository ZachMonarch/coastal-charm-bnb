import { createFileRoute } from "@tanstack/react-router";
import AuthVerify from "@/pages/auth/AuthVerify";

export const Route = createFileRoute("/auth/verify")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthVerify />
  );
}
