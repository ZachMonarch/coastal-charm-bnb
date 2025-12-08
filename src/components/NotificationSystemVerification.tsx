import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Bell, FileText, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { createNotification, notifyQualifiedVendors, notificationTemplates } from '@/utils/notificationService';
import { toast } from 'sonner';

export default function NotificationSystemVerification() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  const testNotificationCreation = async () => {
    if (!user) return false;
    
    try {
      const testNotification = notificationTemplates.projectAssigned('Test Project');
      await createNotification({
        userId: user.id,
        title: testNotification.title,
        message: testNotification.message,
        type: testNotification.type,
        actionUrl: '/test'
      });
      toast.success('Test notification created');
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Test notification failed');
      return false;
    }
  };

  const testVendorBroadcast = async () => {
    try {
      const count = await notifyQualifiedVendors(
        'test-project-id',
        'Test RFQ Project',
        'general',
        ['general'],
        { min: 1000, max: 5000 }
      );
      toast.success(`Test broadcast sent to ${count} vendors`);
      return true;
    } catch (error) {
      console.error('Vendor broadcast test failed:', error);
      toast.error('Vendor broadcast test failed');
      return false;
    }
  };

  const testMilestoneNotification = async () => {
    if (!user) return false;
    
    try {
      const template = notificationTemplates.milestoneApproved('Test Project', 'Test Milestone', '$1,000');
      await createNotification({
        userId: user.id,
        title: template.title,
        message: template.message,
        type: template.type,
        actionUrl: '/vendor/projects'
      });
      toast.success('Test milestone notification created');
      return true;
    } catch (error) {
      console.error('Milestone notification test failed:', error);
      toast.error('Milestone notification test failed');
      return false;
    }
  };

  const testDocumentExpiration = async () => {
    if (!user) return false;
    
    try {
      const template = notificationTemplates.documentExpiring('Insurance Certificate', 7);
      await createNotification({
        userId: user.id,
        title: template.title,
        message: template.message,
        type: template.type,
        actionUrl: '/vendor/documents'
      });
      toast.success('Test document expiration notification created');
      return true;
    } catch (error) {
      console.error('Document expiration test failed:', error);
      toast.error('Document expiration test failed');
      return false;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    const results: { [key: string]: boolean } = {};
    
    results.notificationCreation = await testNotificationCreation();
    results.vendorBroadcast = await testVendorBroadcast();
    results.milestoneNotification = await testMilestoneNotification();
    results.documentExpiration = await testDocumentExpiration();
    
    setTestResults(results);
    setTesting(false);
    
    const allPassed = Object.values(results).every(result => result);
    if (allPassed) {
      toast.success('All notification tests passed! 🎉');
    } else {
      toast.warning('Some notification tests failed. Check the results below.');
    }
  };

  const testFeatures = [
    {
      id: 'notificationCreation',
      name: 'Basic Notification Creation',
      description: 'Test creating notifications via the service',
      icon: <Bell className="h-4 w-4" />,
      test: testNotificationCreation
    },
    {
      id: 'vendorBroadcast',
      name: 'Qualified Vendor Broadcasting',
      description: 'Test notifying qualified vendors about new RFQs',
      icon: <Users className="h-4 w-4" />,
      test: testVendorBroadcast
    },
    {
      id: 'milestoneNotification',
      name: 'Milestone Status Notifications',
      description: 'Test milestone approval/rejection notifications',
      icon: <CheckCircle className="h-4 w-4" />,
      test: testMilestoneNotification
    },
    {
      id: 'documentExpiration',
      name: 'Document Expiration Alerts',
      description: 'Test document expiration warning notifications',
      icon: <FileText className="h-4 w-4" />,
      test: testDocumentExpiration
    }
  ];

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to test notification features</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enhanced Notification System Verification
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test all enhanced notification features to ensure they're working correctly.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Run Comprehensive Test Suite</h3>
              <p className="text-sm text-muted-foreground">
                Test all notification features at once
              </p>
            </div>
            <Button onClick={runAllTests} disabled={testing}>
              {testing ? 'Testing...' : 'Run All Tests'}
            </Button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Test Results:</h4>
              {testFeatures.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <div>
                      <div className="font-medium text-sm">{feature.name}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                  </div>
                  <Badge variant={testResults[feature.id] ? 'default' : 'destructive'}>
                    {testResults[feature.id] ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Individual Feature Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {testFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <div>
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={feature.test}
                  disabled={testing}
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Bell Icon with Unread Badge</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Notification Updates</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enhanced Vendor Templates</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Qualified Vendor Broadcasting</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Milestone Status Notifications</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bid Status Updates</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Document Expiration Alerts</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Triggers & Audit Logs</span>
              <Badge variant="default">✅ Implemented</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}