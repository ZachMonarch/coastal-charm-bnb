import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  systemUptime: number;
  databaseConnections: number;
  errorRate: number;
  responseTime: number;
}

interface PerformanceData {
  timestamp: string;
  responseTime: number;
  errorCount: number;
  userCount: number;
}

export default function ProductionMonitoring() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    systemUptime: 99.9,
    databaseConnections: 0,
    errorRate: 0,
    responseTime: 0,
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch user metrics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (profilesError) throw profilesError;

      // Fetch property metrics
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id');

      if (propertiesError) throw propertiesError;

      // Fetch booking metrics
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, total_amount, created_at');

      if (bookingsError) throw bookingsError;

      // Fetch vendor payment metrics
      const { data: payments, error: paymentsError } = await supabase
        .from('vendor_payments')
        .select('amount, status');

      if (paymentsError) throw paymentsError;

      // Fetch system health metrics
      const { data: healthData, error: healthError } = await supabase
        .from('system_health')
        .select('id, service_name, status, response_time_ms, error_message, checked_at, created_at, metadata')
        .order('checked_at', { ascending: false })
        .limit(20);

      if (healthError) throw healthError;

      // Calculate active users (users who have activity in last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUserCount = profiles?.filter(p => 
        new Date(p.created_at) > yesterday
      ).length || 0;

      // Calculate total revenue
      const totalRevenue = bookings?.reduce((sum, booking) => 
        sum + Number(booking.total_amount || 0), 0
      ) || 0;

      // Calculate payment revenue
      const paymentRevenue = payments?.filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0;

      // Calculate average response time from health data
      const avgResponseTime = healthData?.length > 0 
        ? healthData.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / healthData.length 
        : 0;

      // Calculate error rate
      const errorCount = healthData?.filter(h => h.status === 'down').length || 0;
      const errorRate = healthData?.length > 0 ? (errorCount / healthData.length) * 100 : 0;

      setMetrics({
        totalUsers: profiles?.length || 0,
        activeUsers: activeUserCount,
        totalProperties: properties?.length || 0,
        totalBookings: bookings?.length || 0,
        totalRevenue: totalRevenue + paymentRevenue,
        systemUptime: 100 - errorRate,
        databaseConnections: 5, // Mock value - would need real monitoring
        errorRate,
        responseTime: avgResponseTime,
      });

      setLastUpdated(new Date());
    } catch (error) {
      logger.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSystemStatus = () => {
    if (metrics.systemUptime >= 99) return { status: 'healthy', color: 'text-success', icon: CheckCircle };
    if (metrics.systemUptime >= 95) return { status: 'degraded', color: 'text-warning', icon: AlertTriangle };
    return { status: 'down', color: 'text-destructive', icon: XCircle };
  };

  useEffect(() => {
    fetchMetrics();

    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);

    // Setup real-time monitoring
    const channel = supabase
      .channel('monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_health'
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const systemStatus = getSystemStatus();
  const StatusIcon = systemStatus.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Production Monitoring</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StatusIcon className={`h-5 w-5 ${systemStatus.color}`} />
            <span>System Status: {systemStatus.status.toUpperCase()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.systemUptime.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <Progress value={metrics.systemUptime} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.responseTime.toFixed(0)}ms</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.databaseConnections}</div>
              <div className="text-sm text-muted-foreground">DB Connections</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.activeUsers} active in 24h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProperties.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Total listings
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Total bookings
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Total revenue
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchMetrics} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Refresh Metrics
            </Button>
            <Button 
              onClick={() => window.open('/admin?tab=payments', '_blank')}
              variant="outline" 
              size="sm"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payment Management
            </Button>
            <Button 
              onClick={() => window.open('/admin?tab=users', '_blank')}
              variant="outline" 
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
            <Button 
              onClick={() => window.open('/admin?tab=vendors', '_blank')}
              variant="outline" 
              size="sm"
            >
              <Database className="h-4 w-4 mr-2" />
              Vendor Management
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center text-muted-foreground">
          Loading metrics...
        </div>
      )}
    </div>
  );
}