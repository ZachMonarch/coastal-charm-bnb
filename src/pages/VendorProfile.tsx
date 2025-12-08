import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorProfilePanel from '@/components/VendorProfilePanel';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import PageHero from '@/components/shared/PageHero';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';

export default function VendorProfile() {
  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <EnhancedPageBackground pattern="dots" gradient="mesh" intensity="subtle" showOrbs={true}>
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Enhanced Hero Section */}
          <PageHero
            title="Vendor Profile"
            description="Manage your professional information and credentials"
            icon={User}
            variant="gradient"
            showDecorations={true}
            actions={[
              { label: 'Back to Dashboard', href: '/vendor', variant: 'outline' }
            ]}
          />

          {/* Unified Profile Panel with Tabs */}
          <VendorProfilePanel />
        </div>
      </EnhancedPageBackground>
    </OptimizedProtectedRoute>
  );
}
