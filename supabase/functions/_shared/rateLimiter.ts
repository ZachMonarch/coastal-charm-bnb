// Shared rate limiter utility for edge functions
// Provides IP-based rate limiting with circuit breaker pattern to prevent abuse

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

// In-memory failure cache for circuit breaker pattern
// Key: endpoint:identifier, Value: { count: number, firstFailure: number }
const failureCache = new Map<string, { count: number; firstFailure: number }>();

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 3; // failures before closing circuit
const CIRCUIT_BREAKER_TTL_MS = 60000; // 60 seconds cooldown

/**
 * Clean up expired failure cache entries
 */
function cleanupFailureCache(): void {
  const now = Date.now();
  for (const [key, value] of failureCache.entries()) {
    if (now - value.firstFailure > CIRCUIT_BREAKER_TTL_MS) {
      failureCache.delete(key);
    }
  }
}

/**
 * Log security event for rate limit issues
 */
async function logSecurityEvent(
  supabase: any,
  eventType: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      event_type: eventType,
      severity: 'high',
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    // Don't let logging failures affect the main flow
    console.error('Failed to log security event:', err);
  }
}

/**
 * Check rate limit for a given identifier and endpoint
 * Uses the rate_limits table in Supabase for distributed rate limiting
 * Implements circuit breaker pattern: fail closed after 3 consecutive errors
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, identifier, endpoint } = config;
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const now = Date.now();
  const failureKey = `${endpoint}:${identifier}`;
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up
    cleanupFailureCache();
  }
  
  // Check circuit breaker state
  const failureRecord = failureCache.get(failureKey);
  if (failureRecord) {
    // If TTL expired, clear the record
    if (now - failureRecord.firstFailure > CIRCUIT_BREAKER_TTL_MS) {
      failureCache.delete(failureKey);
    } else if (failureRecord.count >= CIRCUIT_BREAKER_THRESHOLD) {
      // Circuit is OPEN - fail closed for security
      console.warn(`Circuit breaker OPEN for ${endpoint}:${identifier} - blocking request`);
      
      // Log security event (async, don't wait)
      logSecurityEvent(supabase, 'RATE_LIMIT_CIRCUIT_OPEN', {
        endpoint,
        identifier,
        failures: failureRecord.count,
        reason: 'Circuit breaker triggered after consecutive failures'
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(failureRecord.firstFailure + CIRCUIT_BREAKER_TTL_MS)
      };
    }
  }
  
  try {
    // Call the optimized rate limit check function
    const { data, error } = await supabase.rpc('optimized_rate_limit_check', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: Math.floor(windowMs / 1000)
    });
    
    if (error) {
      // Increment failure counter
      const current = failureCache.get(failureKey);
      if (current) {
        failureCache.set(failureKey, {
          count: current.count + 1,
          firstFailure: current.firstFailure
        });
      } else {
        failureCache.set(failureKey, { count: 1, firstFailure: now });
      }
      
      const updatedRecord = failureCache.get(failureKey)!;
      console.error(`Rate limit check error (failure ${updatedRecord.count}/${CIRCUIT_BREAKER_THRESHOLD}):`, error.message);
      
      // Log the failure for monitoring
      logSecurityEvent(supabase, 'RATE_LIMIT_CHECK_FAILED', {
        endpoint,
        identifier,
        error: error.message,
        failureCount: updatedRecord.count
      });
      
      // Allow first 2 failures, block on 3rd
      if (updatedRecord.count >= CIRCUIT_BREAKER_THRESHOLD) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(now + CIRCUIT_BREAKER_TTL_MS)
        };
      }
      
      // Still under threshold - allow but log warning
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now + windowMs)
      };
    }
    
    // Success - clear any failure record
    if (failureCache.has(failureKey)) {
      failureCache.delete(failureKey);
    }
    
    const result = data as { allowed: boolean; current_count: number };
    
    return {
      allowed: result.allowed,
      remaining: Math.max(0, maxRequests - result.current_count),
      resetAt: new Date(now + windowMs)
    };
  } catch (err) {
    // Increment failure counter for unexpected errors
    const current = failureCache.get(failureKey);
    if (current) {
      failureCache.set(failureKey, {
        count: current.count + 1,
        firstFailure: current.firstFailure
      });
    } else {
      failureCache.set(failureKey, { count: 1, firstFailure: now });
    }
    
    const updatedRecord = failureCache.get(failureKey)!;
    console.error(`Unexpected rate limit error (failure ${updatedRecord.count}/${CIRCUIT_BREAKER_THRESHOLD}):`, err);
    
    // Block if threshold reached
    if (updatedRecord.count >= CIRCUIT_BREAKER_THRESHOLD) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + CIRCUIT_BREAKER_TTL_MS)
      };
    }
    
    // Still under threshold - allow but with reduced remaining
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - updatedRecord.count),
      resetAt: new Date(now + windowMs)
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
