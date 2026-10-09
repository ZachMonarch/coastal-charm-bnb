import { createFileRoute } from "@tanstack/react-router";
import BookingPage from "@/pages/BookingPage";

export const Route = createFileRoute("/book/$propertyId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <BookingPage />
  );
}
