import EnhancedPaymentManagement from "@/components/admin/EnhancedPaymentManagement";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function AdminPayments() {
  return (
    <PrivatePageWrapper title="Payment Management">
      <EnhancedPaymentManagement />
    </PrivatePageWrapper>
  );
}
