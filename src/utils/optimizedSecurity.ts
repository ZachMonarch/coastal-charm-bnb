// Optimized security utilities with minimal overhead
import { supabase } from '@/integrations/supabase/client';

class OptimizedSecurityUtils {
  private static instance: OptimizedSecurityUtils;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  static getInstance(): OptimizedSecurityUtils {
    if (!OptimizedSecurityUtils.instance) {
      OptimizedSecurityUtils.instance = new OptimizedSecurityUtils();
    }
    return OptimizedSecurityUtils.instance;
  }

  private consecutiveRateLimitFailures = 0;
  private readonly MAX_FAILURES_BEFORE_FAIL_CLOSED = 3;

  // Enhanced client-side rate limiting with circuit breaker
  checkClientRateLimit(key: string, maxRequests: number = 20, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitCache.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitCache.set(key, { count: 1, resetTime: now + windowMs });
      // Reset failure counter on successful window reset
      this.consecutiveRateLimitFailures = 0;
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  // Circuit breaker for rate limit failures
  async handleRateLimitFailure(): Promise<boolean> {
    this.consecutiveRateLimitFailures++;
    
    // Log security event
    this.logSecurityEvent('RATE_LIMIT_CHECK_FAILED', {
      consecutiveFailures: this.consecutiveRateLimitFailures,
      timestamp: new Date().toISOString()
    }).catch(() => {});
    
    // Fail closed after MAX_FAILURES attempts
    if (this.consecutiveRateLimitFailures >= this.MAX_FAILURES_BEFORE_FAIL_CLOSED) {
      console.error('⛔ Rate limit circuit breaker activated - failing closed');
      
      // Send alert notification to admins
      await this.sendCircuitBreakerAlert();
      
      return false; // Deny request
    }
    
    // Fail open for first few failures (transient issues)
    console.warn(`⚠️ Rate limit check failed (${this.consecutiveRateLimitFailures}/${this.MAX_FAILURES_BEFORE_FAIL_CLOSED})`);
    return true; // Allow request
  }

  // Send circuit breaker activation alert to admins
  private async sendCircuitBreakerAlert(): Promise<void> {
    try {
      // Get all admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (!adminRoles || adminRoles.length === 0) return;

      // Create notifications for all admins
      const notifications = adminRoles.map(admin => ({
        user_id: admin.user_id,
        title: '⛔ Circuit Breaker Activated',
        message: `Rate limit circuit breaker has been activated after ${this.consecutiveRateLimitFailures} consecutive failures. System is now failing closed for security.`,
        type: 'error',
        priority: 'high',
        category: 'security',
        action_url: '/admin/security'
      }));

      await supabase.from('notifications').insert(notifications);

      // Also log to security events table
      await supabase.rpc('log_security_audit', {
        p_event_type: 'CIRCUIT_BREAKER_ACTIVATED',
        p_severity: 'critical',
        p_details: {
          consecutiveFailures: this.consecutiveRateLimitFailures,
          timestamp: new Date().toISOString(),
          action: 'FAIL_CLOSED'
        }
      });
    } catch (error) {
      console.error('Failed to send circuit breaker alert:', error);
    }
  }

  // Reset circuit breaker on successful checks
  resetRateLimitCircuit(): void {
    this.consecutiveRateLimitFailures = 0;
  }

  // Cached API call with rate limiting
  async cachedApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttlMs: number = 300000, // 5 minutes default
    enableRateLimit: boolean = true
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    // Rate limit check
    if (enableRateLimit && !this.checkClientRateLimit(key, 10, 60000)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const data = await apiCall();
      this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
      return data;
    } catch (error) {
      console.warn(`API call failed for ${key}:`, error);
      throw error;
    }
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Enhanced password validation with security logging
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for minimum length
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    // Check for character requirements
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123|abc|qwerty|password|admin/i, // Common sequences
      /^[a-zA-Z]+$/, // Only letters
      /^[0-9]+$/, // Only numbers
    ];

    weakPatterns.forEach(pattern => {
      if (pattern.test(password)) {
        errors.push('Password contains weak patterns and is not secure');
      }
    });

    // Log weak password attempts for security monitoring
    if (errors.length > 0) {
      this.logSecurityEvent('WEAK_PASSWORD_ATTEMPT', {
        errors: errors.length,
        length: password.length
      }).catch(() => {}); // Silent fail for logging
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Clean up expired cache entries
  cleanup(): void {
    const now = Date.now();
    
    // Clean rate limit cache
    for (const [key, record] of this.rateLimitCache.entries()) {
      if (now > record.resetTime) {
        this.rateLimitCache.delete(key);
      }
    }

    // Clean API cache
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get security stats
  getStats() {
    return {
      rateLimitEntries: this.rateLimitCache.size,
      cachedRequests: this.cache.size,
    };
  }

  // Generate secure token
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Log security events (optimized)
  async logSecurityEvent(event: string, details: Record<string, any> = {}): Promise<void> {
    try {
      // Use cached call to prevent spam
      await this.cachedApiCall(
        `security_log_${event}_${Date.now()}`,
        async () => {
          await supabase.rpc('log_security_audit', {
            p_event_type: event,
            p_severity: 'info',
            p_details: details
          });
          return true;
        },
        60000, // Cache for 1 minute to prevent spam
        true // Enable rate limiting
      );
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }
}

// Export singleton instance
export const optimizedSecurity = OptimizedSecurityUtils.getInstance();

// Auto cleanup every 10 minutes
setInterval(() => {
  optimizedSecurity.cleanup();
}, 10 * 60 * 1000);

export default optimizedSecurity;