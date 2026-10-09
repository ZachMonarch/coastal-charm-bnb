import { createFileRoute } from "@tanstack/react-router";
import Properties from "@/pages/Properties";

export const Route = createFileRoute("/properties/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Properties />
  );
}
