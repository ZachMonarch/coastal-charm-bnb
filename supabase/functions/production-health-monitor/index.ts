import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  // Require INTERNAL_CRON_SECRET or admin JWT
  const cronSecret = Deno.env.get('INTERNAL_CRON_SECRET');
  const providedSecret = req.headers.get('X-Cron-Secret') || req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!cronSecret || providedSecret !== cronSecret) {
    // Fallback: check if caller has a valid admin JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();
    const checks: Record<string, 'healthy' | 'degraded' | 'down'> = {};

    // Database
    try {
      const dbStart = Date.now();
      const { error } = await supabaseClient.from('system_health').select('id').limit(1);
      const ms = Date.now() - dbStart;
      checks.database = error ? 'down' : ms < 1000 ? 'healthy' : 'degraded';
    } catch { checks.database = 'down'; }

    // Auth
    try {
      const { error } = await supabaseClient.auth.admin.listUsers({ page: 1, perPage: 1 });
      checks.authentication = error ? 'degraded' : 'healthy';
    } catch { checks.authentication = 'down'; }

    // Storage
    try {
      const { error } = await supabaseClient.storage.listBuckets();
      checks.storage = error ? 'degraded' : 'healthy';
    } catch { checks.storage = 'down'; }

    const downCount = Object.values(checks).filter(s => s === 'down').length;
    const degradedCount = Object.values(checks).filter(s => s === 'degraded').length;
    const overallStatus = downCount > 0 ? 'down' : degradedCount > 0 ? 'degraded' : 'healthy';

    // Store health results
    for (const [service, status] of Object.entries(checks)) {
      await supabaseClient.from('system_health').insert({
        service_name: service,
        status,
        checked_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      overall_status: overallStatus,
      timestamp: new Date().toISOString(),
      total_response_time: Date.now() - startTime,
      checks,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: overallStatus === 'down' ? 503 : overallStatus === 'degraded' ? 206 : 200,
    });

  } catch (error) {
    console.error('Health monitor error:', error);
    return new Response(JSON.stringify({
      overall_status: 'down',
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
