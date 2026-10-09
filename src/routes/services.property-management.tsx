import { createFileRoute } from "@tanstack/react-router";
import PropertyManagement from "@/pages/services/PropertyManagement";

export const Route = createFileRoute("/services/property-management")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PropertyManagement />
  );
}
