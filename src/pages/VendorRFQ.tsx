import VendorRFQTabs from "@/components/VendorRFQTabs";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { FileText, TrendingUp, Award, DollarSign } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";

export default function VendorRFQ() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <PrivatePageWrapper title="RFQ Management">
        <EnhancedPageBackground pattern="dots" gradient="mesh" intensity="subtle" showOrbs={true}>
          <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Enhanced Hero Section */}
            <PageHero
              title="RFQ Management"
              description="Browse opportunities, manage bids, and track awarded projects"
              icon={FileText}
              variant="gradient"
              showDecorations={true}
              stats={[
                { label: 'Active Bids', value: 'View Bids', icon: TrendingUp, color: 'info' },
                { label: 'Projects Won', value: 'Awarded', icon: Award, color: 'success' },
                { label: 'Earnings', value: 'Track', icon: DollarSign, color: 'warning' },
              ]}
            />
            
            <VendorRFQTabs />
          </div>
        </EnhancedPageBackground>
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}
