import { createFileRoute } from "@tanstack/react-router";
import ApartmentBookingPage from "@/pages/ApartmentBooking";

export const Route = createFileRoute("/apartments/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ApartmentBookingPage />
  );
}
