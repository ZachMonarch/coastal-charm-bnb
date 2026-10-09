import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL kept working: permanent client/server redirect (was <Navigate replace /> in App.tsx)
export const Route = createFileRoute("/admin/control-suite")({
  beforeLoad: () => {
    throw redirect({ href: "/admin/operations", replace: true });
  },
});
