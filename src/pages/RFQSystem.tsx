import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VendorRFQSystem from "@/components/VendorRFQSystem";
import AdminRFQSystem from "@/components/AdminRFQSystem";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import PageHero from "@/components/shared/PageHero";
import { FileText, Briefcase, ShieldAlert } from "lucide-react";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";

export default function RFQSystem() {
  const { hasRole } = useAuth();

  return (
    <OptimizedProtectedRoute>
      <EnhancedPageBackground 
        pattern="dots" 
        gradient="mesh" 
        primaryColor="primary" 
        intensity="subtle"
        showOrbs={true}
      >
        <div className="container mx-auto px-4 py-8 space-y-6">
          {hasRole('admin') ? (
            <>
              <PageHero
                title="RFQ Management System"
                description="Manage requests for quotes, vendor bids, and project assignments"
                icon={FileText}
                variant="gradient"
                showDecorations={true}
              />
              <AdminRFQSystem />
            </>
          ) : hasRole('vendor') ? (
            <>
              <PageHero
                title="Available Projects"
                description="Browse and apply for available projects that match your expertise"
                icon={Briefcase}
                variant="gradient"
                showDecorations={true}
              />
              <VendorRFQSystem />
            </>
          ) : (
            <div className="text-center py-12">
              <PageHero
                title="Access Restricted"
                description="This area is only available to admins and vendors"
                icon={ShieldAlert}
                variant="secondary"
                showDecorations={false}
              />
            </div>
          )}
        </div>
      </EnhancedPageBackground>
    </OptimizedProtectedRoute>
  );
}
