import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  endpoint: string;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'auth': { maxRequests: 10, windowMinutes: 15, endpoint: 'auth' },
  'api': { maxRequests: 100, windowMinutes: 60, endpoint: 'api' },
  'upload': { maxRequests: 20, windowMinutes: 60, endpoint: 'upload' },
  'payment': { maxRequests: 5, windowMinutes: 60, endpoint: 'payment' },
};

function getClientIdentifier(req: Request): string {
  // Try to get user ID from auth, fallback to IP
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

function getEndpointType(url: string): string {
  if (url.includes('/auth/')) return 'auth';
  if (url.includes('/upload') || url.includes('/storage/')) return 'upload';
  if (url.includes('/payment') || url.includes('/stripe')) return 'payment';
  return 'api';
}

async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpointType: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  const config = DEFAULT_LIMITS[endpointType] || DEFAULT_LIMITS['api'];
  
  try {
    const { data: result, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: config.endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: config.maxRequests, resetTime: new Date() };
    }

    // Calculate reset time
    const resetTime = new Date();
    resetTime.setMinutes(resetTime.getMinutes() + config.windowMinutes);

    // Get current count
    const { data: currentData } = await supabase
      .from('rate_limits')
      .select('requests_count')
      .eq('identifier', identifier)
      .eq('endpoint', config.endpoint)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentCount = currentData?.requests_count || 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    return {
      allowed: result === true,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if rate limiting is broken
    return { allowed: true, remaining: config.maxRequests, resetTime: new Date() };
  }
}

function createRateLimitResponse(remaining: number, resetTime: Date, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toISOString(),
        'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString(),
      },
    }
  );
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

    // Parse request body for endpoint parameter
    let endpoint = '/';
    try {
      const body = await req.json();
      endpoint = body.endpoint || '/';
    } catch (e) {
      // If no body or invalid JSON, use default endpoint
      endpoint = '/';
    }

    // Get client identifier
    const identifier = getClientIdentifier(req);
    const endpointType = getEndpointType(endpoint);

    // Use new optimized rate limit function
    const { data: isAllowed, error } = await supabaseClient.rpc('optimized_rate_limit_check', {
      p_identifier: identifier,
      p_endpoint: endpointType,
      p_max_requests: DEFAULT_LIMITS[endpointType]?.maxRequests || 100,
      p_window_minutes: DEFAULT_LIMITS[endpointType]?.windowMinutes || 60,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      
      // Fail closed for sensitive endpoints, fail open for others
      if (endpointType === 'auth' || endpointType === 'payment') {
        return new Response(
          JSON.stringify({
            error: 'Rate limit service unavailable',
            message: 'Security service temporarily unavailable. Please try again later.',
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      // Fail open for API endpoints to maintain availability
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: 100,
          resetTime: new Date(Date.now() + 60 * 60 * 1000),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Calculate reset time
    const resetTime = new Date(Date.now() + (DEFAULT_LIMITS[endpointType]?.windowMinutes || 60) * 60 * 1000);
    
    // Get remaining requests (approximate)
    const maxRequests = DEFAULT_LIMITS[endpointType]?.maxRequests || 100;
    const remaining = isAllowed ? Math.floor(maxRequests * 0.8) : 0;

    if (!isAllowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toISOString(),
            'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining,
        resetTime: resetTime.toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetTime.toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    const endpoint = '/';
    const endpointType = getEndpointType(endpoint);
    
    // Fail closed for sensitive endpoints, fail open for others
    if (endpointType === 'auth' || endpointType === 'payment') {
      return new Response(
        JSON.stringify({
          error: 'Rate limit service unavailable',
          message: 'Security service temporarily unavailable. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Fail open for high availability on API endpoints
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: 100,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});