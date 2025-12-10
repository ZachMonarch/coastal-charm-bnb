import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import VendorProfileOverview from './VendorProfileOverview';
import VendorProfileForm from './VendorProfileForm';
import VendorProfileBranding from './VendorProfileBranding';
import VendorProfileNotifications from './VendorProfileNotifications';

export default function VendorProfilePanel() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList variant="grid" className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
        <TabsTrigger value="overview" variant="grid">Overview</TabsTrigger>
        <TabsTrigger value="edit" variant="grid">Edit Profile</TabsTrigger>
        <TabsTrigger value="branding" variant="grid">Brand & Logo</TabsTrigger>
        <TabsTrigger value="notifications" variant="grid">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <VendorProfileOverview />
      </TabsContent>

      <TabsContent value="edit">
        <Card className="border-primary/20 shadow-lg p-6">
          <VendorProfileForm />
        </Card>
      </TabsContent>

      <TabsContent value="branding">
        <VendorProfileBranding />
      </TabsContent>

      <TabsContent value="notifications">
        <VendorProfileNotifications />
      </TabsContent>
    </Tabs>
  );
}
