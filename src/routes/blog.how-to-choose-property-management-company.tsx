import { createFileRoute } from "@tanstack/react-router";
import ChoosePropertyManagementCompany from "@/pages/guides/ChoosePropertyManagementCompany";

export const Route = createFileRoute("/blog/how-to-choose-property-management-company")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ChoosePropertyManagementCompany />
  );
}
