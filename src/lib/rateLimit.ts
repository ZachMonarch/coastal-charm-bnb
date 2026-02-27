/**
 * Application-level rate limiting wrapper
 *
 * CANONICAL RATE-LIMIT PATHS (do not delete unused DB functions):
 *   - Client app → this file → `check_rate_limit` RPC
 *   - Edge middleware → `optimized_rate_limit_check` RPC
 *
 * Other DB functions (enhanced_rate_limit_check, enhanced_auth_rate_limit_check,
 * check_auth_rate_limit) are unused but retained for safety.
 */

import { supabase } from '@/integrations/supabase/client';

// Client-side cache for rate limit tracking (fallback)
const clientRateLimitCache = new Map<string, { count: number; windowStart: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  failOpen?: boolean; // If true, allow request on rate limit check failure
}

// Predefined rate limits for different endpoint types
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth/signin': { maxRequests: 5, windowSeconds: 300, failOpen: false },
  'auth/signup': { maxRequests: 3, windowSeconds: 600, failOpen: false },
  'auth/reset': { maxRequests: 3, windowSeconds: 600, failOpen: false },
  'api/query': { maxRequests: 100, windowSeconds: 60, failOpen: true },
  'api/mutation': { maxRequests: 50, windowSeconds: 60, failOpen: true },
  'upload': { maxRequests: 10, windowSeconds: 60, failOpen: false },
  'payment': { maxRequests: 5, windowSeconds: 60, failOpen: false },
  'default': { maxRequests: 60, windowSeconds: 60, failOpen: true },
};

/**
 * Client-side rate limit check (fallback when DB check fails)
 */
function checkClientRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number } {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  const cached = clientRateLimitCache.get(key);
  
  if (!cached || (now - cached.windowStart) > windowMs) {
    // Start new window
    clientRateLimitCache.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  if (cached.count >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  cached.count++;
  return { allowed: true, remaining: config.maxRequests - cached.count };
}

/**
 * Check rate limit using database function
 */
async function checkDatabaseRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number } | null> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: Math.ceil(config.windowSeconds / 60)
    });
    
    if (error) {
      console.warn('Rate limit DB check failed:', error.message);
      return null;
    }
    
    return { 
      allowed: data === true, 
      remaining: data === true ? config.maxRequests - 1 : 0 
    };
  } catch (err) {
    console.warn('Rate limit check exception:', err);
    return null;
  }
}

/**
 * Main rate limiting function
 * Tries database check first, falls back to client-side
 */
export async function checkRateLimit(
  endpoint: string,
  identifier?: string
): Promise<{ allowed: boolean; remaining: number }> {
  // Get user ID or use IP-based identifier
  let id = identifier;
  if (!id) {
    const { data: { user } } = await supabase.auth.getUser();
    id = user?.id || 'anonymous';
  }
  
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
  
  // Try database rate limit check
  const dbResult = await checkDatabaseRateLimit(id, endpoint, config);
  
  if (dbResult !== null) {
    return dbResult;
  }
  
  // Fallback to client-side rate limiting
  if (config.failOpen) {
    console.warn('[RateLimit] DB check failed, falling back to client-side', { endpoint, identifier: id });
    return checkClientRateLimit(id, endpoint, config);
  }
  
  // For critical endpoints, deny on rate limit check failure
  console.error('[RateLimit] DB check failed for critical endpoint, denying request', { endpoint, identifier: id });
  return { allowed: false, remaining: 0 };
}

/**
 * Rate-limited operation wrapper
 * Wraps an async operation with rate limiting
 */
export async function withRateLimit<T>(
  endpoint: string,
  operation: () => Promise<T>,
  options?: { identifier?: string; throwOnLimit?: boolean }
): Promise<T> {
  const { allowed, remaining } = await checkRateLimit(endpoint, options?.identifier);
  
  if (!allowed) {
    const error = new Error(`Rate limit exceeded for ${endpoint}. Please try again later.`);
    (error as any).code = 'RATE_LIMIT_EXCEEDED';
    (error as any).remaining = remaining;
    
    // Log rate limit event
    try {
      await supabase.rpc('log_security_event', {
        event_type: 'RATE_LIMIT_EXCEEDED',
        p_table_name: null,
        p_record_id: null,
        details: { endpoint, identifier: options?.identifier }
      });
    } catch {
      // Ignore logging failures
    }
    
    if (options?.throwOnLimit !== false) {
      throw error;
    }
  }
  
  return operation();
}

/**
 * Rate-limited sign in helper
 */
export async function rateLimitedSignIn(
  email: string,
  password: string
): Promise<ReturnType<typeof supabase.auth.signInWithPassword>> {
  return withRateLimit('auth/signin', async () => {
    return supabase.auth.signInWithPassword({ email, password });
  });
}

/**
 * Rate-limited sign up helper
 */
export async function rateLimitedSignUp(
  email: string,
  password: string,
  metadata?: Record<string, any>
): Promise<ReturnType<typeof supabase.auth.signUp>> {
  return withRateLimit('auth/signup', async () => {
    return supabase.auth.signUp({ 
      email, 
      password,
      options: { data: metadata }
    });
  });
}

/**
 * Rate-limited password reset helper
 */
export async function rateLimitedResetPassword(
  email: string
): Promise<ReturnType<typeof supabase.auth.resetPasswordForEmail>> {
  return withRateLimit('auth/reset', async () => {
    return supabase.auth.resetPasswordForEmail(email);
  });
}

/**
 * Cleanup old client-side rate limit entries
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, value] of clientRateLimitCache.entries()) {
    if (now - value.windowStart > maxAge) {
      clientRateLimitCache.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimitCache, 5 * 60 * 1000);
}
