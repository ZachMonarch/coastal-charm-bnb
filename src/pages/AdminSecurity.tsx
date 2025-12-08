import ComprehensiveSecurityDashboard from "@/components/admin/ComprehensiveSecurityDashboard";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function AdminSecurity() {
  return (
    <PrivatePageWrapper title="Security Command Center">
      <ComprehensiveSecurityDashboard />
    </PrivatePageWrapper>
  );
}