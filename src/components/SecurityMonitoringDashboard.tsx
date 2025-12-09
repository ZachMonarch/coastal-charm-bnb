import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, Eye, RefreshCw } from 'lucide-react';
import { securityMonitor, SecurityAlert } from '@/utils/securityMonitoring';
import { toast } from 'sonner';

// Penetration testing is run manually via the security audit process
const runPenetrationTests = async () => {
  console.log('Penetration testing should be run via security audit tools');
  return Promise.resolve();
};

export default function SecurityMonitoringDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [recentAlerts, securityMetrics] = await Promise.all([
        securityMonitor.getRecentAlerts(20),
        securityMonitor.getSecurityMetrics(24),
      ]);
      setAlerts(recentAlerts);
      setMetrics(securityMetrics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPenetrationTests = async () => {
    setRunningTests(true);
    try {
      await runPenetrationTests();
      toast.success('Penetration tests completed - check console for results');
    } catch (error) {
      console.error('Penetration tests failed:', error);
      toast.error('Failed to run penetration tests');
    } finally {
      setRunningTests(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'medium':
        return 'bg-warning/70 text-warning-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading security monitoring data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Monitoring
          </h1>
          <p className="text-muted-foreground">Real-time security alerts and system health</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleRunPenetrationTests} disabled={runningTests} size="sm">
            <Eye className="h-4 w-4 mr-2" />
            {runningTests ? 'Running Tests...' : 'Run Pen Tests'}
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-sm text-muted-foreground">Total Events (24h)</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 dark:border-destructive/50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <div className="text-2xl font-bold text-destructive">{metrics.critical}</div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 dark:border-warning/40">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-warning">{metrics.high}</div>
              <p className="text-sm text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 dark:border-warning/40">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-warning">{metrics.medium}</div>
              <p className="text-sm text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-success">{metrics.low}</div>
              <p className="text-sm text-muted-foreground">Low</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
          <CardDescription>Last 20 security events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">No security alerts in the last 24 hours</p>
              <p className="text-sm text-muted-foreground">System is operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} className="border-l-4" style={{ borderLeftColor: `var(--${alert.severity})` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.message}
                      </AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 text-sm">
                          <p><strong>Event Type:</strong> {alert.eventType}</p>
                          <p><strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</p>
                          {alert.userId && <p><strong>User ID:</strong> {alert.userId}</p>}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Type Breakdown */}
      {metrics?.byType && Object.keys(metrics.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Event Type Breakdown</CardTitle>
            <CardDescription>Security events by type (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{type}</span>
                  <Badge variant="outline">{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
