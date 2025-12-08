// Monarch Property Management - Health Check Edge Function
// Comprehensive system health monitoring endpoint

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    storage: boolean;
    auth: boolean;
    functions: boolean;
  };
  metrics?: {
    database?: {
      connections: number;
      responseTime: number;
    };
    storage?: {
      buckets: number;
      responseTime: number;
    };
  };
  errors?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const healthCheck: HealthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0',
    uptime: Date.now() - startTime,
    checks: {
      database: false,
      storage: false,
      auth: false,
      functions: false,
    },
    metrics: {},
    errors: [],
  };

  try {
    // ========================================
    // 1. Database Health Check
    // ========================================
    const dbStart = Date.now();
    const { data: dbData, error: dbError } = await supabase
      .from('system_health')
      .select('id')
      .limit(1);
    
    healthCheck.checks.database = !dbError;
    healthCheck.metrics!.database = {
      connections: 0, // Would need pg_stat_activity query
      responseTime: Date.now() - dbStart,
    };

    if (dbError) {
      healthCheck.errors!.push(`Database: ${dbError.message}`);
    }

    // ========================================
    // 2. Storage Health Check
    // ========================================
    const storageStart = Date.now();
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    healthCheck.checks.storage = !storageError;
    healthCheck.metrics!.storage = {
      buckets: buckets?.length || 0,
      responseTime: Date.now() - storageStart,
    };

    if (storageError) {
      healthCheck.errors!.push(`Storage: ${storageError.message}`);
    }

    // ========================================
    // 3. Auth Health Check
    // ========================================
    const { error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    healthCheck.checks.auth = !authError;

    if (authError) {
      healthCheck.errors!.push(`Auth: ${authError.message}`);
    }

    // ========================================
    // 4. Edge Functions Health Check
    // ========================================
    // Simple check - if we're running, functions are healthy
    healthCheck.checks.functions = true;

    // ========================================
    // Determine Overall Status
    // ========================================
    const allHealthy = Object.values(healthCheck.checks).every(v => v === true);
    const criticalUnhealthy = !healthCheck.checks.database || !healthCheck.checks.auth;

    if (criticalUnhealthy) {
      healthCheck.status = 'unhealthy';
    } else if (!allHealthy) {
      healthCheck.status = 'degraded';
    } else {
      healthCheck.status = 'healthy';
    }

    // Set response status code based on health
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 207 : 503;

    return new Response(
      JSON.stringify(healthCheck, null, 2),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.errors!.push(`Critical: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return new Response(
      JSON.stringify(healthCheck, null, 2),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        } 
      }
    );
  }
});
