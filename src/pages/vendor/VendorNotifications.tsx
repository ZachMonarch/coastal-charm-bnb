import VendorNotificationCenter from '@/components/VendorNotificationCenter';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHeroWithImage from '@/components/shared/PageHeroWithImage';
import { Bell } from 'lucide-react';

export default function VendorNotifications() {
  return (
    <PrivatePageWrapper title="Notifications">
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="info" intensity="subtle" showOrbs>
        <div className="container mx-auto py-6 space-y-6">
          <PageHeroWithImage
            title="Notifications"
            description="View and manage your vendor notifications"
            icon={Bell}
            backgroundImage="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=1920&q=80"
            compact
            height="md"
          />
          <VendorNotificationCenter />
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
