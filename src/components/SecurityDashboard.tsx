import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import SecurityModule from './SecurityModule';
import EnhancedSecurityMonitor from './EnhancedSecurityMonitor';
import { Shield, AlertTriangle, Activity } from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();

  // Only show to admin users
  if (!user || !hasRole('admin')) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Security dashboard access requires admin privileges.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Security Center</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="grid" className="grid w-full grid-cols-3">
          <TabsTrigger variant="grid" value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger variant="grid" value="monitoring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Real-time Monitoring
          </TabsTrigger>
          <TabsTrigger variant="grid" value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EnhancedSecurityMonitor />
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Security Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedSecurityMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <SecurityModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;