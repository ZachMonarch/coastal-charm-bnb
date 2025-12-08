import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, AlertTriangle, XCircle, RefreshCw, 
  Database, Shield, Zap, Globe, Server, Monitor
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  message: string;
  details?: any;
}

interface SystemMetrics {
  uptime: number;
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  memoryUsage: number;
}

export const ProductionHealthCheck: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const runHealthChecks = async () => {
    setLoading(true);
    const checks: HealthCheckResult[] = [];

    // Database connectivity check
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      const responseTime = Date.now() - start;
      
      checks.push({
        service: 'Database',
        status: error ? 'error' : 'healthy',
        responseTime,
        message: error ? `Database error: ${error.message}` : 'Database connection healthy',
        details: { recordCount: data?.length || 0 }
      });
    } catch (error) {
      checks.push({
        service: 'Database',
        status: 'error',
        responseTime: 0,
        message: 'Database connection failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Authentication service check
    try {
      const start = Date.now();
      const { data } = await supabase.auth.getSession();
      const responseTime = Date.now() - start;
      
      checks.push({
        service: 'Authentication',
        status: 'healthy',
        responseTime,
        message: 'Authentication service operational',
        details: { hasSession: !!data.session }
      });
    } catch (error) {
      checks.push({
        service: 'Authentication',
        status: 'error',
        responseTime: 0,
        message: 'Authentication service error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Storage service check
    try {
      const start = Date.now();
      const { data } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - start;
      
      checks.push({
        service: 'Storage',
        status: 'healthy',
        responseTime,
        message: 'Storage service operational',
        details: { bucketCount: data?.length || 0 }
      });
    } catch (error) {
      checks.push({
        service: 'Storage',
        status: 'error',
        responseTime: 0,
        message: 'Storage service error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Performance metrics check
    const performanceMetrics = getPerformanceMetrics();
    checks.push({
      service: 'Performance',
      status: performanceMetrics.score > 80 ? 'healthy' : performanceMetrics.score > 60 ? 'warning' : 'error',
      responseTime: performanceMetrics.score,
      message: `Performance score: ${performanceMetrics.score}/100`,
      details: performanceMetrics
    });

    // Security check
    const securityCheck = getSecurityStatus();
    checks.push({
      service: 'Security',
      status: securityCheck.secure ? 'healthy' : 'warning',
      responseTime: 0,
      message: securityCheck.message,
      details: securityCheck.details
    });

    setHealthChecks(checks);
    setLastCheck(new Date());
    setLoading(false);

    // Update system metrics
    updateSystemMetrics();
  };

  const getPerformanceMetrics = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
    const score = Math.max(0, Math.min(100, 100 - (loadTime / 50))); // Score based on load time

    return {
      score: Math.round(score),
      loadTime,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
    };
  };

  const getSecurityStatus = () => {
    const isHTTPS = window.location.protocol === 'https:';
    const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null;
    
    return {
      secure: isHTTPS,
      message: isHTTPS ? 'HTTPS enabled' : 'Security warning: Not using HTTPS',
      details: {
        https: isHTTPS,
        csp: hasCSP,
        mixedContent: !isHTTPS && window.location.hostname !== 'localhost'
      }
    };
  };

  const updateSystemMetrics = () => {
    const metrics: SystemMetrics = {
      uptime: performance.now() / 1000, // Seconds since page load
      totalRequests: healthChecks.length * 10, // Simulated
      errorRate: (healthChecks.filter(check => check.status === 'error').length / healthChecks.length) * 100,
      avgResponseTime: healthChecks.reduce((acc, check) => acc + check.responseTime, 0) / healthChecks.length,
      memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0
    };

    setMetrics(metrics);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Monitor className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getServiceIcon = (service: string) => {
    const icons = {
      Database: <Database className="h-4 w-4" />,
      Authentication: <Shield className="h-4 w-4" />,
      Storage: <Server className="h-4 w-4" />,
      Performance: <Zap className="h-4 w-4" />,
      Security: <Shield className="h-4 w-4" />
    };

    return icons[service as keyof typeof icons] || <Monitor className="h-4 w-4" />;
  };

  const overallStatus = healthChecks.every(check => check.status === 'healthy') 
    ? 'healthy' 
    : healthChecks.some(check => check.status === 'error') 
    ? 'error' 
    : 'warning';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
              {getStatusBadge(overallStatus)}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runHealthChecks}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-medium">{Math.round(metrics.uptime)}s</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{metrics.errorRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={100 - metrics.errorRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Response</span>
                    <span className="font-medium">{Math.round(metrics.avgResponseTime)}ms</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Memory</span>
                    <span className="font-medium">{Math.round(metrics.memoryUsage)}MB</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Checks</CardTitle>
          {lastCheck && (
            <p className="text-sm text-muted-foreground">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthChecks.map((check, index) => (
              <Alert key={index} className={`
                ${check.status === 'healthy' ? 'border-success/30 bg-success/10 dark:border-success/40 dark:bg-success/20' : ''}
                ${check.status === 'warning' ? 'border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/20' : ''}
                ${check.status === 'error' ? 'border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/20' : ''}
              `}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {getServiceIcon(check.service)}
                        <span className="font-medium">{check.service}</span>
                        {getStatusBadge(check.status)}
                      </div>
                      <AlertDescription className="text-sm">
                        {check.message}
                      </AlertDescription>
                      {check.responseTime > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Response time: {check.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {overallStatus !== 'healthy' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthChecks
                .filter(check => check.status !== 'healthy')
                .map((check, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>
                      <strong>{check.service}:</strong> {check.message}
                      {check.service === 'Database' && check.status === 'error' && (
                        <div className="mt-2 text-sm">
                          • Check database connection settings<br/>
                          • Verify network connectivity<br/>
                          • Check database server status
                        </div>
                      )}
                      {check.service === 'Performance' && check.status !== 'healthy' && (
                        <div className="mt-2 text-sm">
                          • Enable code splitting<br/>
                          • Optimize images and assets<br/>
                          • Use CDN for static resources
                        </div>
                      )}
                      {check.service === 'Security' && check.status !== 'healthy' && (
                        <div className="mt-2 text-sm">
                          • Enable HTTPS in production<br/>
                          • Configure Content Security Policy<br/>
                          • Review security headers
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionHealthCheck;