import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL kept working: permanent client/server redirect (was <Navigate replace /> in App.tsx)
export const Route = createFileRoute("/vendor-onboarding/")({
  beforeLoad: () => {
    throw redirect({ href: "/vendor-onboarding/profile", replace: true });
  },
});
