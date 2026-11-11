import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: "Real Estate Listings & Rentals | Monarch Property Management" },
      {
        name: "description",
        content:
          "Explore real estate listings and rental accommodations, professional property management, maintenance, and vendor services in West Virginia.",
      },
      { property: "og:title", content: "Real Estate Listings, Rentals & Property Management | Monarch" },
      {
        property: "og:description",
        content:
          "Browse real estate listings and rental accommodations with property management and maintenance services from Monarch in West Virginia.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://monarchpropertymmgt.online/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://monarchpropertymmgt.online/" }],
  }),
});

function RouteComponent() {
  return (
    <Index />
  );
}
