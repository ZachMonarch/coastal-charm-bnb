import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL kept working: permanent client/server redirect (was <Navigate replace /> in App.tsx)
export const Route = createFileRoute("/dashboard/vendors")({
  beforeLoad: () => {
    throw redirect({ href: "/admin?tab=vendors", replace: true });
  },
});
