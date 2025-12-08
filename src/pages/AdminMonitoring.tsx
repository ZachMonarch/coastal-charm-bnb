import ProductionMonitoring from "@/components/ProductionMonitoring";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function AdminMonitoring() {
  return (
    <PrivatePageWrapper title="System Monitoring">
      <ProductionMonitoring />
    </PrivatePageWrapper>
  );
}