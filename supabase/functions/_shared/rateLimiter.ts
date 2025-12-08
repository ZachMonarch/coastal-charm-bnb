// Shared rate limiter utility for edge functions
// Provides IP-based rate limiting to prevent abuse

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
  endpoint: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check rate limit for a given identifier and endpoint
 * Uses the rate_limits table in Supabase for distributed rate limiting
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, identifier, endpoint } = config;
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const windowStart = new Date(Date.now() - windowMs);
  const now = new Date();
  
  try {
    // Call the optimized rate limit check function
    const { data, error } = await supabase.rpc('optimized_rate_limit_check', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: Math.floor(windowMs / 1000)
    });
    
    if (error) {
      // Log error but fail open to prevent service disruption
      console.error('Rate limit check error:', error.message);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs)
      };
    }
    
    const result = data as { allowed: boolean; current_count: number };
    
    return {
      allowed: result.allowed,
      remaining: Math.max(0, maxRequests - result.current_count),
      resetAt: new Date(now.getTime() + windowMs)
    };
  } catch (err) {
    // Fail open on unexpected errors
    console.error('Unexpected rate limit error:', err);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now.getTime() + windowMs)
    };
  }
}

/**
 * Get client IP from request headers
 * Handles various proxy configurations
 */
export function getClientIP(req: Request): string {
  // Check various headers for client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP if multiple are present
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  // Fallback to unknown
  return 'unknown';
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
        ...corsHeaders
      }
    }
  );
}
