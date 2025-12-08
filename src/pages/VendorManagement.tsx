import EnhancedVendorSystem from "@/components/EnhancedVendorSystem";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VendorManagement() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <EnhancedVendorSystem />
      </div>
    </div>
  );
}