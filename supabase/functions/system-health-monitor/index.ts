import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorMessage?: string;
}

async function checkDatabaseHealth(supabase: any): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        service: 'database',
        status: 'down',
        responseTime,
        errorMessage: error.message,
      };
    }

    return {
      service: 'database',
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'down',
      responseTime: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAuthHealth(supabase: any): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Test auth service by getting session
    const { data, error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        service: 'auth',
        status: 'down',
        responseTime,
        errorMessage: error.message,
      };
    }

    return {
      service: 'auth',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      service: 'auth',
      status: 'down',
      responseTime: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkStorageHealth(supabase: any): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Test storage by listing buckets
    const { data, error } = await supabase.storage.listBuckets();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        service: 'storage',
        status: 'down',
        responseTime,
        errorMessage: error.message,
      };
    }

    return {
      service: 'storage',
      status: responseTime > 1500 ? 'degraded' : 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      service: 'storage',
      status: 'down',
      responseTime: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkExternalServices(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  
  // Check Stripe connectivity (if payment processing is critical)
  const stripeStartTime = Date.now();
  try {
    const response = await fetch('https://api.stripe.com/v1/charges/limit=1', {
      headers: {
        'Authorization': `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
      },
    });
    
    const responseTime = Date.now() - stripeStartTime;
    
    checks.push({
      service: 'stripe',
      status: response.ok ? (responseTime > 2000 ? 'degraded' : 'healthy') : 'down',
      responseTime,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
    });
  } catch (error) {
    checks.push({
      service: 'stripe',
      status: 'down',
      responseTime: Date.now() - stripeStartTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return checks;
}

async function performHealthChecks(supabase: any): Promise<HealthCheck[]> {
  const checks = await Promise.all([
    checkDatabaseHealth(supabase),
    checkAuthHealth(supabase),
    checkStorageHealth(supabase),
  ]);

  // Add external service checks
  const externalChecks = await checkExternalServices();
  checks.push(...externalChecks);

  return checks;
}

async function saveHealthResults(supabase: any, checks: HealthCheck[]) {
  try {
    const healthRecords = checks.map(check => ({
      service_name: check.service,
      status: check.status,
      response_time_ms: check.responseTime,
      error_message: check.errorMessage || null,
      checked_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('system_health')
      .insert(healthRecords);

    if (error) {
      console.error('Failed to save health check results:', error);
    }
  } catch (error) {
    console.error('Error saving health results:', error);
  }
}

function calculateOverallHealth(checks: HealthCheck[]): {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  criticalServices: string[];
} {
  const criticalServices = ['database', 'auth'];
  const criticalChecks = checks.filter(c => criticalServices.includes(c.service));
  
  // If any critical service is down, system is down
  if (criticalChecks.some(c => c.status === 'down')) {
    return {
      status: 'down',
      uptime: 0,
      criticalServices: criticalChecks.filter(c => c.status === 'down').map(c => c.service),
    };
  }

  // If any service is degraded, system is degraded
  if (checks.some(c => c.status === 'degraded')) {
    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    return {
      status: 'degraded',
      uptime: (healthyCount / checks.length) * 100,
      criticalServices: [],
    };
  }

  return {
    status: 'healthy',
    uptime: 100,
    criticalServices: [],
  };
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Perform all health checks
    const healthChecks = await performHealthChecks(supabaseClient);

    // Calculate overall system health
    const overallHealth = calculateOverallHealth(healthChecks);

    // Save results to database
    await saveHealthResults(supabaseClient, healthChecks);

    // Log critical issues
    if (overallHealth.status === 'down') {
      console.error('CRITICAL: System is down!', {
        criticalServices: overallHealth.criticalServices,
        checks: healthChecks,
      });
    } else if (overallHealth.status === 'degraded') {
      console.warn('WARNING: System performance degraded', {
        uptime: overallHealth.uptime,
        checks: healthChecks,
      });
    }

    // Return health status
    return new Response(
      JSON.stringify({
        status: overallHealth.status,
        uptime: overallHealth.uptime,
        timestamp: new Date().toISOString(),
        services: healthChecks,
        criticalServices: overallHealth.criticalServices,
      }),
      {
        status: overallHealth.status === 'down' ? 503 : 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Health-Status': overallHealth.status,
          'X-System-Uptime': overallHealth.uptime.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Health monitor error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'down',
        error: 'Health monitoring system failure',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});