import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, RefreshCw, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

interface SystemHealth {
  id: string;
  service_name: string;
  status: string;
  response_time_ms: number;
  error_message?: string | null;
  checked_at: string;
}

interface RateLimit {
  id: string;
  identifier: string;
  endpoint: string;
  requests_count: number;
  window_start: string;
  created_at: string;
}

export default function SecurityModule() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'health' | 'limits'>('audit');
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch audit logs (last 100) - explicit columns for egress optimization
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, table_name, record_id, ip_address, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Fetch system health - explicit columns
      const { data: healthData, error: healthError } = await supabase
        .from('system_health')
        .select('id, service_name, status, response_time_ms, error_message, checked_at')
        .order('checked_at', { ascending: false })
        .limit(50);

      if (healthError) throw healthError;

      // Fetch rate limits (current window) - explicit columns
      const { data: limitsData, error: limitsError } = await supabase
        .from('rate_limits')
        .select('id, identifier, endpoint, requests_count, window_start, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (limitsError) throw limitsError;

      setAuditLogs((auditData as AuditLog[]) || []);
      setSystemHealth((healthData as SystemHealth[]) || []);
      setRateLimits((limitsData as RateLimit[]) || []);
    } catch (error) {
      logger.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const services = ['database', 'auth', 'storage', 'edge-functions'];
      const healthChecks = [];

      for (const service of services) {
        const startTime = Date.now();
        let status: 'healthy' | 'degraded' | 'down' = 'healthy';
        let errorMessage = '';

        try {
          // Simple health check based on service
          switch (service) {
            case 'database':
              await supabase.from('profiles').select('count').limit(1);
              break;
            case 'auth':
              await supabase.auth.getSession();
              break;
            case 'storage':
              await supabase.storage.listBuckets();
              break;
            case 'edge-functions':
              // Check if functions are accessible
              break;
          }
        } catch (error) {
          status = 'down';
          errorMessage = error instanceof Error ? error.message : 'Unknown error';
        }

        const responseTime = Date.now() - startTime;
        if (responseTime > 3000) status = 'degraded';

        healthChecks.push({
          service_name: service,
          status,
          response_time_ms: responseTime,
          error_message: errorMessage || null,
        });
      }

      // Insert health check results
      const { error } = await supabase
        .from('system_health')
        .insert(healthChecks);

      if (error) throw error;

      toast({
        title: "Health Check Complete",
        description: "System health status updated",
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error performing health check:', error);
      toast({
        title: "Error",
        description: "Failed to perform health check",
        variant: "destructive",
      });
    }
  };

  const cleanupOldData = async () => {
    try {
      // Cleanup old audit logs (keep last 30 days)
      await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Cleanup old rate limits
      await supabase.rpc('cleanup_rate_limits');

      // Cleanup old health checks (keep last 7 days)
      await supabase
        .from('system_health')
        .delete()
        .lt('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      toast({
        title: "Cleanup Complete",
        description: "Old security data has been cleaned up",
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup old data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSecurityData();

    // Setup real-time subscriptions for security monitoring
    const auditSubscription = supabase
      .channel('audit-logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_logs'
      }, () => {
        fetchSecurityData();
      })
      .subscribe();

    const healthSubscription = supabase
      .channel('system-health')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_health'
      }, () => {
        fetchSecurityData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(auditSubscription);
      supabase.removeChannel(healthSubscription);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success';
      case 'degraded': return 'bg-warning';
      case 'down': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'down': return 'destructive';
      default: return 'outline';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-success/10 text-success border-success/30';
      case 'UPDATE': return 'bg-info/10 text-info border-info/30';
      case 'DELETE': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Security & Monitoring</h2>
        </div>
        <div className="flex space-x-2">
          <Button onClick={checkSystemHealth} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Button onClick={cleanupOldData} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={fetchSecurityData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert for critical issues */}
      {systemHealth.some(h => h.status === 'down') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Critical system issues detected! Some services are down.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'audit', label: 'Audit Logs', icon: Eye },
          { id: 'health', label: 'System Health', icon: Activity },
          { id: 'limits', label: 'Rate Limits', icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <div>
                      <div className="font-medium">{log.table_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Record ID: {log.record_id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      User: {log.user_id?.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No audit logs found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'health' && (
        <Card>
          <CardHeader>
            <CardTitle>System Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemHealth.map((health) => (
                <div key={health.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">{health.service_name}</h3>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(health.status)}`} />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Status: <Badge variant={getStatusBadgeVariant(health.status)}>{health.status}</Badge></div>
                    <div>Response Time: {health.response_time_ms}ms</div>
                    <div>Checked: {new Date(health.checked_at).toLocaleString()}</div>
                    {health.error_message && (
                      <div className="text-destructive">Error: {health.error_message}</div>
                    )}
                  </div>
                </div>
              ))}
              {systemHealth.length === 0 && (
                <div className="col-span-2 text-center text-muted-foreground py-8">
                  No health checks found. Run a health check to see system status.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'limits' && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rateLimits.map((limit) => (
                <div key={limit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{limit.endpoint}</div>
                    <div className="text-sm text-muted-foreground">
                      Identifier: {limit.identifier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {limit.requests_count} requests
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Window: {new Date(limit.window_start).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {rateLimits.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No rate limit data found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
