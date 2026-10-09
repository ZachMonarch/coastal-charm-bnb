import { createFileRoute } from "@tanstack/react-router";
import VendorShowcase from "@/pages/VendorShowcase";

export const Route = createFileRoute("/vendors/$vendorId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <VendorShowcase />
  );
}
