import { createFileRoute } from "@tanstack/react-router";
import JoinAsVendor from "@/pages/JoinAsVendor";

export const Route = createFileRoute("/join-as-vendor")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <JoinAsVendor />
  );
}
