import { createFileRoute } from "@tanstack/react-router";
import Amenities from "@/pages/Amenities";

export const Route = createFileRoute("/amenities")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Amenities />
  );
}
