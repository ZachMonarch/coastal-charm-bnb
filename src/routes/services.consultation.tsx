import { createFileRoute } from "@tanstack/react-router";
import Consultation from "@/pages/services/Consultation";

export const Route = createFileRoute("/services/consultation")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Consultation />
  );
}
