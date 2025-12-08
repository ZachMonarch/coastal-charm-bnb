import AdminManagementSystem from "@/components/AdminManagementSystem";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function AdminDashboard() {
  return (
    <PrivatePageWrapper title="Admin Dashboard">
      <AdminManagementSystem />
    </PrivatePageWrapper>
  );
}