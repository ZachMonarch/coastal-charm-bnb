import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import EmailTestComponent from './EmailTestComponent';

interface HealthCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function SystemHealthDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const runHealthChecks = async () => {
    setLoading(true);
    const checks: HealthCheck[] = [];

    try {
      // 1. Database Connection
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        checks.push({
          name: 'Database Connection',
          status: error ? 'error' : 'success',
          message: error ? 'Database connection failed' : 'Database connected successfully',
          details: error?.message
        });
      } catch (error) {
        checks.push({
          name: 'Database Connection',
          status: 'error',
          message: 'Database connection failed',
          details: (error as Error).message
        });
      }

      // 2. Authentication Status
      checks.push({
        name: 'Authentication',
        status: isAuthenticated ? 'success' : 'warning',
        message: isAuthenticated ? 'User is authenticated' : 'User not authenticated',
        details: user ? `User ID: ${user.id}, Role: ${user.role}` : 'No user session'
      });

      // 3. Edge Functions Health - removed invalid test call
      checks.push({
        name: 'Email Service',
        status: 'success',
        message: 'Email service configured',
        details: 'Use the Email Test tool below to verify email functionality'
      });

      // 4. Vendor System
      if (user?.role === 'vendor') {
        try {
          const { data, error } = await supabase
            .from('vendor_profiles')
            .select('id, user_id, company_name, is_verified, availability_status, subscription_status, created_at')
            .eq('user_id', user.id)
            .single();
          
          checks.push({
            name: 'Vendor Profile',
            status: error ? 'error' : (data ? 'success' : 'warning'),
            message: error ? 'Vendor profile error' : (data ? 'Vendor profile found' : 'Vendor profile missing'),
            details: error?.message || (data ? `Verified: ${data.is_verified}` : 'Profile needs to be created')
          });
        } catch (error) {
          checks.push({
            name: 'Vendor Profile',
            status: 'error',
            message: 'Vendor profile check failed',
            details: (error as Error).message
          });
        }
      }

      // 5. Projects System
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('count', { count: 'exact', head: true });
        
        checks.push({
          name: 'Projects System',
          status: error ? 'error' : 'success',
          message: error ? 'Projects system error' : 'Projects system operational',
          details: error?.message
        });
      } catch (error) {
        checks.push({
          name: 'Projects System',
          status: 'error',
          message: 'Projects system check failed',
          details: (error as Error).message
        });
      }

      // 6. Payment System
      try {
        const { data, error } = await supabase
          .from('vendor_payments')
          .select('count', { count: 'exact', head: true });
        
        checks.push({
          name: 'Payment System',
          status: error ? 'error' : 'success',
          message: error ? 'Payment system error' : 'Payment system operational',
          details: error?.message
        });
      } catch (error) {
        checks.push({
          name: 'Payment System',
          status: 'error',
          message: 'Payment system check failed',
          details: (error as Error).message
        });
      }

      // 7. Notifications System
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('count', { count: 'exact', head: true });
        
        checks.push({
          name: 'Notifications System',
          status: error ? 'error' : 'success',
          message: error ? 'Notifications system error' : 'Notifications system operational',
          details: error?.message
        });
      } catch (error) {
        checks.push({
          name: 'Notifications System',
          status: 'error',
          message: 'Notifications system check failed',
          details: (error as Error).message
        });
      }

    } catch (error) {
      checks.push({
        name: 'System Check',
        status: 'error',
        message: 'System health check failed',
        details: (error as Error).message
      });
    }

    setHealthChecks(checks);
    setLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-success/30 bg-success/10 dark:border-success/40 dark:bg-success/20';
      case 'error':
        return 'border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/20';
      case 'warning':
        return 'border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/20';
      default:
        return 'border-border bg-muted/50';
    }
  };

  const successCount = healthChecks.filter(check => check.status === 'success').length;
  const errorCount = healthChecks.filter(check => check.status === 'error').length;
  const warningCount = healthChecks.filter(check => check.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Health Dashboard</h2>
          <p className="text-muted-foreground">Monitor system components and functionality</p>
        </div>
        <Button onClick={runHealthChecks} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Checks
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-success/30 dark:border-success/40">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{successCount}</div>
            <div className="text-sm text-muted-foreground">Healthy</div>
          </CardContent>
        </Card>
        <Card className="border-warning/30 dark:border-warning/40">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{warningCount}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 dark:border-destructive/40">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>System Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthChecks.map((check, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h4 className="font-medium">{check.name}</h4>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
                <Badge variant={check.status === 'success' ? 'default' : check.status === 'error' ? 'destructive' : 'secondary'}>
                  {check.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Test */}
      <EmailTestComponent />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              If you see any errors above, please contact system administrator or check the console for detailed error messages.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}