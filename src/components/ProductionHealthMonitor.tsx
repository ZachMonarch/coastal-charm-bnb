import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface HealthStatus {
  database: 'healthy' | 'degraded' | 'down';
  authentication: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
}

export default function ProductionHealthMonitor() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    database: 'healthy',
    authentication: 'healthy',
    storage: 'healthy',
    lastChecked: new Date()
  });
  const { user } = useAuth();

  useEffect(() => {
    const checkHealth = async () => {
      const newStatus: HealthStatus = {
        database: 'healthy',
        authentication: 'healthy',
        storage: 'healthy',
        lastChecked: new Date()
      };

      try {
        // Test database connectivity
        const { error: dbError } = await supabase
          .from('properties')
          .select('id')
          .limit(1);
        
        newStatus.database = dbError ? 'down' : 'healthy';
      } catch {
        newStatus.database = 'down';
      }

      try {
        // Test authentication
        const { error: authError } = await supabase.auth.getSession();
        newStatus.authentication = authError ? 'degraded' : 'healthy';
      } catch {
        newStatus.authentication = 'down';
      }

      try {
        // Test storage (basic check)
        const { error: storageError } = await supabase.storage.listBuckets();
        newStatus.storage = storageError ? 'degraded' : 'healthy';
      } catch {
        newStatus.storage = 'down';
      }

      setHealthStatus(newStatus);

      // Log health status for monitoring (only in production for admins)
      const isAdmin = user && typeof user === 'object' && 'role' in user && user.role === 'admin';
      if (process.env.NODE_ENV === 'production' && isAdmin) {
        try {
          const allHealthy = Object.entries(newStatus)
            .filter(([key]) => key !== 'lastChecked')
            .every(([, value]) => value === 'healthy');
          
          await supabase
            .from('system_health')
            .insert([{
              service_name: 'web_app',
              status: allHealthy ? 'healthy' : 'degraded',
              metadata: {
                database: newStatus.database,
                authentication: newStatus.authentication,
                storage: newStatus.storage,
                lastChecked: newStatus.lastChecked.toISOString()
              }
            }]);
        } catch {
          // Silent fail for health logging
        }
      }
    };

    // Initial check
    checkHealth();

    // Check every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Only render health indicator for admins in development or critical issues
  const isDevAdmin = process.env.NODE_ENV === 'development' && 
    user && typeof user === 'object' && 'role' in user && user.role === 'admin';
  if (!isDevAdmin) {
    return null;
  }

  const hasIssues = Object.values(healthStatus).some(status => 
    typeof status === 'string' && status !== 'healthy'
  );

  if (!hasIssues) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-xs">
        <div className="font-medium text-warning">System Status</div>
        <div className="text-foreground">DB: {healthStatus.database}</div>
        <div className="text-foreground">Auth: {healthStatus.authentication}</div>
        <div className="text-foreground">Storage: {healthStatus.storage}</div>
      </div>
    </div>
  );
}