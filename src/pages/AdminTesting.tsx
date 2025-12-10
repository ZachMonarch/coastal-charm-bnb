import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentSystemVerification from "@/components/PaymentSystemVerification";
import NotificationSystemVerification from "@/components/NotificationSystemVerification";
import SecurityTestingPanel from "@/components/SecurityTestingPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CreditCard, Bell, TestTube } from "lucide-react";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function AdminTesting() {
  return (
    <PrivatePageWrapper title="System Testing Center">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TestTube className="h-8 w-8" />
          System Testing Center
        </h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for all system components and integrations
        </p>
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList variant="default" className="w-full sm:w-auto">
          <TabsTrigger value="payment" variant="default" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment System</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" variant="default" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" variant="default" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security Tests</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment & Invoicing System Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentSystemVerification />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification System Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationSystemVerification />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Comprehensive Security Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityTestingPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PrivatePageWrapper>
  );
}