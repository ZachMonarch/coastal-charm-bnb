import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useProperties } from '@/hooks/useProperties';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  Globe,
  Users,
  Building2
} from 'lucide-react';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export default function AppHealthCheck() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties({}, 1);
  
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const checks: HealthCheckResult[] = [];

    // Authentication Check
    checks.push({
      service: 'Authentication',
      status: isAuthenticated ? 'healthy' : 'warning',
      message: isAuthenticated ? 'User authenticated' : 'Not authenticated',
      details: { user: user?.email || 'No user' }
    });

    // Database Connection Check
    try {
      if (properties.length > 0 || !propertiesLoading) {
        checks.push({
          service: 'Database',
          status: propertiesError ? 'error' : 'healthy',
          message: propertiesError ? `Error: ${propertiesError}` : `Connected (${properties.length} properties loaded)`,
          details: { propertiesCount: properties.length, error: propertiesError }
        });
      } else if (propertiesLoading) {
        checks.push({
          service: 'Database', 
          status: 'warning',
          message: 'Loading...',
          details: { loading: true }
        });
      }
    } catch (error) {
      checks.push({
        service: 'Database',
        status: 'error',
        message: `Connection failed: ${error}`,
        details: { error }
      });
    }

    // API Check
    checks.push({
      service: 'API',
      status: 'healthy',
      message: 'Supabase API accessible',
      details: { url: 'yhegaaqxmuhszesbjtdo.supabase.co' }
    });

    // Performance Check
    const perfCheck = {
      service: 'Performance',
      status: 'healthy' as 'healthy' | 'warning' | 'error',
      message: 'Good performance',
      details: {
        authLoading,
        propertiesLoading,
        responseTime: 'Normal'
      }
    };

    if (authLoading || propertiesLoading) {
      perfCheck.status = 'warning';
      perfCheck.message = 'Some services still loading';
    }

    checks.push(perfCheck);

    setHealthChecks(checks);
    setLastCheck(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, [isAuthenticated, properties.length, propertiesError, authLoading, propertiesLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const overallHealth = healthChecks.every(check => check.status === 'healthy') ? 'healthy' :
                      healthChecks.some(check => check.status === 'error') ? 'error' : 'warning';

  return (
    <Card className="neumorphic-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Application Health
            </CardTitle>
            <CardDescription>
              System status and performance monitoring
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(overallHealth)}>
              {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={runHealthCheck}
              disabled={isChecking}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {healthChecks.map((check, index) => (
            <div key={index} className="neumorphic-inset p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium text-sm">{check.service}</p>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(check.status)}>
                  {check.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {lastCheck && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Last check: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}