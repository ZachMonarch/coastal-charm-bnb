import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  message?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for health checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const healthChecks: HealthCheck[] = [];
    const startTime = Date.now();

    // 1. Database Health Check
    try {
      const dbStart = Date.now();
      const { data, error } = await supabaseClient
        .from('system_health')
        .select('count', { count: 'exact' })
        .limit(1);

      const dbResponseTime = Date.now() - dbStart;

      if (error) {
        healthChecks.push({
          service: 'database',
          status: 'down',
          response_time: dbResponseTime,
          message: `Database error: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      } else {
        healthChecks.push({
          service: 'database',
          status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
          response_time: dbResponseTime,
          message: dbResponseTime < 1000 ? 'Database responsive' : 'Database slow response',
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError: any) {
      healthChecks.push({
        service: 'database',
        status: 'down',
        response_time: Date.now() - startTime,
        message: `Database connection failed: ${dbError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Authentication Service Health Check
    try {
      const authStart = Date.now();
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      const authResponseTime = Date.now() - authStart;

      healthChecks.push({
        service: 'authentication',
        status: authError ? 'degraded' : 'healthy',
        response_time: authResponseTime,
        message: authError ? `Auth service issue: ${authError.message}` : 'Auth service operational',
        timestamp: new Date().toISOString()
      });
    } catch (authError: any) {
      healthChecks.push({
        service: 'authentication',
        status: 'down',
        response_time: Date.now() - startTime,
        message: `Auth service failed: ${authError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Storage Health Check
    try {
      const storageStart = Date.now();
      const { data: buckets, error: storageError } = await supabaseClient.storage.listBuckets();
      const storageResponseTime = Date.now() - storageStart;

      healthChecks.push({
        service: 'storage',
        status: storageError ? 'degraded' : 'healthy',
        response_time: storageResponseTime,
        message: storageError ? `Storage issue: ${storageError.message}` : 'Storage service operational',
        timestamp: new Date().toISOString()
      });
    } catch (storageError: any) {
      healthChecks.push({
        service: 'storage',
        status: 'down',
        response_time: Date.now() - startTime,
        message: `Storage service failed: ${storageError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // 4. Edge Functions Health Check
    try {
      const edgeStart = Date.now();
      // Self-test: Try to invoke a lightweight function or test endpoint
      const { error: edgeError } = await supabaseClient.functions.invoke('rate-limit-middleware', {
        body: { endpoint: 'health-check' }
      });
      const edgeResponseTime = Date.now() - edgeStart;

      healthChecks.push({
        service: 'edge_functions',
        status: edgeError ? 'degraded' : 'healthy',
        response_time: edgeResponseTime,
        message: edgeError ? `Edge functions issue: ${edgeError.message}` : 'Edge functions operational',
        timestamp: new Date().toISOString()
      });
    } catch (edgeError: any) {
      healthChecks.push({
        service: 'edge_functions',
        status: 'degraded',
        response_time: Date.now() - startTime,
        message: 'Edge functions self-test skipped',
        timestamp: new Date().toISOString()
      });
    }

    // 5. External API Health Checks (Stripe, etc.)
    try {
      const externalStart = Date.now();
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      
      if (stripeKey) {
        const stripeResponse = await fetch('https://api.stripe.com/v1/account', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
          }
        });
        const externalResponseTime = Date.now() - externalStart;

        healthChecks.push({
          service: 'stripe_api',
          status: stripeResponse.ok ? 'healthy' : 'degraded',
          response_time: externalResponseTime,
          message: stripeResponse.ok ? 'Stripe API accessible' : `Stripe API issue: ${stripeResponse.status}`,
          timestamp: new Date().toISOString()
        });
      } else {
        healthChecks.push({
          service: 'stripe_api',
          status: 'degraded',
          response_time: 0,
          message: 'Stripe API key not configured',
          timestamp: new Date().toISOString()
        });
      }
    } catch (externalError: any) {
      healthChecks.push({
        service: 'stripe_api',
        status: 'down',
        response_time: Date.now() - startTime,
        message: `Stripe API failed: ${externalError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // Calculate overall system health
    const totalServices = healthChecks.length;
    const healthyServices = healthChecks.filter(hc => hc.status === 'healthy').length;
    const degradedServices = healthChecks.filter(hc => hc.status === 'degraded').length;
    const downServices = healthChecks.filter(hc => hc.status === 'down').length;

    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downServices > 0) {
      overallStatus = 'down';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    const healthReport = {
      overall_status: overallStatus,
      timestamp: new Date().toISOString(),
      total_response_time: Date.now() - startTime,
      services: healthChecks,
      summary: {
        total: totalServices,
        healthy: healthyServices,
        degraded: degradedServices,
        down: downServices,
        uptime_percentage: ((healthyServices + degradedServices) / totalServices) * 100
      }
    };

    // Store health check results
    for (const check of healthChecks) {
      await supabaseClient
        .from('system_health')
        .insert({
          service_name: check.service,
          status: check.status,
          response_time_ms: check.response_time,
          error_message: check.message,
          checked_at: check.timestamp
        });
    }

    // Record overall health metric
    await supabaseClient.rpc('record_metric', {
      p_metric_name: 'system_health_score',
      p_metric_value: healthReport.summary.uptime_percentage,
      p_metric_type: 'gauge',
      p_tags: {
        overall_status: overallStatus,
        total_services: totalServices,
        healthy_services: healthyServices,
        down_services: downServices
      }
    });

    // Send alerts for critical issues
    if (overallStatus === 'down' || downServices > 1) {
      console.warn('CRITICAL: System health degraded', healthReport);
      
      // In production, you would send alerts via email, Slack, etc.
      // await sendCriticalAlert(healthReport);
    }

    return new Response(JSON.stringify(healthReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: overallStatus === 'down' ? 503 : overallStatus === 'degraded' ? 206 : 200,
    });

  } catch (error: any) {
    console.error('Health monitor error:', error);
    
    return new Response(JSON.stringify({
      overall_status: 'down',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});