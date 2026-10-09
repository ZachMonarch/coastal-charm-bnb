import { createFileRoute } from "@tanstack/react-router";
import RequestQuote from "@/pages/RequestQuote";

export const Route = createFileRoute("/request-quote")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequestQuote />
  );
}
