import { createFileRoute } from "@tanstack/react-router";
import VendorOnboarding from "@/pages/VendorOnboarding";

export const Route = createFileRoute("/vendor/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <VendorOnboarding />
  );
}
