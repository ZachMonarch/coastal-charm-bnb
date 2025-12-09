import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Beaker, TestTube, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import { useState } from 'react';

export default function AdminLabs() {
  const [features, setFeatures] = useState({
    newProjectUI: false,
    advancedReports: false,
    aiVendorMatching: false,
    realtimeNotifications: true,
    betaPayments: false,
    experimentalDashboard: false,
  });

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Beaker className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Labs & Experiments</h1>
                <p className="text-muted-foreground">Test features and development tools (Admin Only)</p>
              </div>
            </div>
            <Badge variant="outline" className="border-warning/20 text-warning dark:border-warning/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Experimental
            </Badge>
          </div>

          {/* Warning Banner */}
          <Card className="border-warning/20 bg-warning/5 shadow-lg dark:bg-warning/10 dark:border-warning/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Experimental Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Features in Labs are experimental and may be unstable. Enable at your own risk. 
                    These features are not recommended for production use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-primary" />
                <CardTitle>Feature Flags</CardTitle>
              </div>
              <CardDescription>
                Toggle experimental features for testing and development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-project-ui" className="text-base">
                    New Project UI
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Redesigned project management interface with enhanced workflow
                  </p>
                </div>
                <Switch
                  id="new-project-ui"
                  checked={features.newProjectUI}
                  onCheckedChange={() => toggleFeature('newProjectUI')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="advanced-reports" className="text-base">
                    Advanced Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enhanced analytics with custom report builder
                  </p>
                </div>
                <Switch
                  id="advanced-reports"
                  checked={features.advancedReports}
                  onCheckedChange={() => toggleFeature('advancedReports')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-vendor-matching" className="text-base">
                    AI Vendor Matching
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Machine learning-powered vendor selection and matching
                  </p>
                </div>
                <Switch
                  id="ai-vendor-matching"
                  checked={features.aiVendorMatching}
                  onCheckedChange={() => toggleFeature('aiVendorMatching')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="realtime-notifications" className="text-base">
                    Real-time Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    WebSocket-based instant notifications system
                  </p>
                  <Badge variant="secondary" className="mt-1 bg-success/10 text-success dark:bg-success/20">
                    Stable
                  </Badge>
                </div>
                <Switch
                  id="realtime-notifications"
                  checked={features.realtimeNotifications}
                  onCheckedChange={() => toggleFeature('realtimeNotifications')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="beta-payments" className="text-base">
                    Beta Payment System
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New payment processing flow with ACH support
                  </p>
                </div>
                <Switch
                  id="beta-payments"
                  checked={features.betaPayments}
                  onCheckedChange={() => toggleFeature('betaPayments')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="experimental-dashboard" className="text-base">
                    Experimental Dashboard
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Completely redesigned dashboard layout and metrics
                  </p>
                </div>
                <Switch
                  id="experimental-dashboard"
                  checked={features.experimentalDashboard}
                  onCheckedChange={() => toggleFeature('experimentalDashboard')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Tools */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                <CardTitle>Development Tools</CardTitle>
              </div>
              <CardDescription>
                Testing and debugging utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="border-primary/20">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Database
                </Button>
                <Button variant="outline" className="border-primary/20">
                  <TestTube className="h-4 w-4 mr-2" />
                  Generate Test Data
                </Button>
                <Button variant="outline" className="border-primary/20">
                  <Beaker className="h-4 w-4 mr-2" />
                  Run Health Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OptimizedProtectedRoute>
  );
}
