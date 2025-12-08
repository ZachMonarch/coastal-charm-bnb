import VendorNotificationCenter from '@/components/VendorNotificationCenter';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHero from '@/components/shared/PageHero';
import { Bell } from 'lucide-react';

export default function VendorNotifications() {
  return (
    <PrivatePageWrapper title="Notifications">
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="info" intensity="subtle" showOrbs>
        <div className="container mx-auto py-6 space-y-6">
          <PageHero
            title="Notifications"
            description="View and manage your vendor notifications"
            icon={Bell}
            variant="primary"
          />
          <VendorNotificationCenter />
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
