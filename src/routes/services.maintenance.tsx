import { createFileRoute } from "@tanstack/react-router";
import Maintenance from "@/pages/services/Maintenance";

export const Route = createFileRoute("/services/maintenance")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Maintenance />
  );
}
