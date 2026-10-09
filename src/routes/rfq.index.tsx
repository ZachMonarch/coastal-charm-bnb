import { createFileRoute } from "@tanstack/react-router";
import RFQDiscovery from "@/pages/public/RFQDiscovery";

export const Route = createFileRoute("/rfq/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RFQDiscovery />
  );
}
