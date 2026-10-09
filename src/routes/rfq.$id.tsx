import { createFileRoute } from "@tanstack/react-router";
import PublicRFQView from "@/pages/public/PublicRFQView";

export const Route = createFileRoute("/rfq/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PublicRFQView />
  );
}
