import { createFileRoute } from "@tanstack/react-router";
import PropertyDetails from "@/pages/PropertyDetails";

export const Route = createFileRoute("/properties/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PropertyDetails />
  );
}
