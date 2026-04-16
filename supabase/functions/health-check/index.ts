// Monarch Property Management - Health Check Edge Function
// Comprehensive system health monitoring endpoint with rate limiting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Simple in-memory rate limiter (per-instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);

  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  
  const rateCheck = checkRateLimit(clientIP);
  
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        } 
      }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const checks = {
    database: false,
    storage: false,
    auth: false,
    functions: true,
  };

  try {
    // Database check
    const { error: dbError } = await supabase
      .from('system_health')
      .select('id')
      .limit(1);
    checks.database = !dbError;

    // Storage check
    const { error: storageError } = await supabase.storage.listBuckets();
    checks.storage = !storageError;

    // Auth check
    const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.auth = !authError;

    const allHealthy = Object.values(checks).every(v => v);
    const criticalDown = !checks.database || !checks.auth;

    const status = criticalDown ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded';
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503;

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status,
        version: '1.0.1',
        checks,
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        }
      }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        checks,
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        } 
      }
    );
  }
});
