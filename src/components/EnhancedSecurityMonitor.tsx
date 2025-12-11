import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { AlertTriangle, Shield, Activity, Lock } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  created_at: string;
  details: any;
}

interface SecurityStats {
  critical_events: number;
  high_events: number;
  total_events_today: number;
  blocked_attempts: number;
}

export const EnhancedSecurityMonitor: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Only show to admin users
  if (!user || !hasRole('admin')) {
    return null;
  }

  const fetchSecurityData = async () => {
    try {
      // Fetch recent security events
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('id, event_type, severity, user_id, created_at, details')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      // Calculate stats from events directly (no security_dashboard view needed)
      const criticalCount = events?.filter(e => e.severity === 'critical').length || 0;
      const highCount = events?.filter(e => e.severity === 'high').length || 0;
      const blockedCount = events?.filter(e => e.event_type.includes('BLOCKED') || e.event_type.includes('FAILED')).length || 0;
      
      const stats: SecurityStats = {
        critical_events: criticalCount,
        high_events: highCount,
        total_events_today: events?.length || 0,
        blocked_attempts: blockedCount,
      };

      setSecurityEvents(events || []);
      setSecurityStats(stats);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch security data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchSecurityData();

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading security data...</p>
        </CardContent>
      </Card>
    );
  }

  const hasCriticalEvents = securityStats && securityStats.critical_events > 0;

  return (
    <div className="space-y-6">
      {hasCriticalEvents && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {securityStats.critical_events} critical security events detected in the last 24 hours. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSecurityData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {securityStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {securityStats.critical_events}
                </div>
                <div className="text-sm text-muted-foreground">Critical Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {securityStats.high_events}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {securityStats.total_events_today}
                </div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">
                  {securityStats.blocked_attempts}
                </div>
                <div className="text-sm text-muted-foreground">Blocked Attempts</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Recent Security Events</h3>
            {securityEvents.length === 0 ? (
              <p className="text-muted-foreground">No recent security events</p>
            ) : (
              securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="font-medium">{event.event_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(event.details).slice(0, 2).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(event.severity)}>
                    {event.severity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSecurityMonitor;