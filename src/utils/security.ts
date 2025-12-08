import { supabase } from '@/integrations/supabase/client';
import { rateLimitCache } from './rateLimitCache';

// Security utility functions for production-ready application

export const SecurityUtils = {
  // Input sanitization
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove potential XSS vectors
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Validate email format
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  validatePassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
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

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Enhanced rate limiting check with client-side caching
  checkRateLimit: async (endpoint: string): Promise<{ allowed: boolean; remaining: number }> => {
    try {
      // First check client-side rate limiting
      const clientKey = `client_${endpoint}`;
      if (!rateLimitCache.checkRateLimit(clientKey, 20, 60000)) {
        return { allowed: false, remaining: 0 };
      }

      // Check cache for recent server response
      const cacheKey = `rate_limit_${endpoint}`;
      const cached = rateLimitCache.getCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Make server request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data } = await supabase.functions.invoke('rate-limit-middleware', {
        body: { endpoint }
      });
      
      clearTimeout(timeoutId);
      
      const result = {
        allowed: data?.allowed !== false,
        remaining: data?.remaining || 50,
      };

      // Cache successful response for 30 seconds
      rateLimitCache.setCache(cacheKey, result, 30000);
      
      return result;
    } catch (error) {
      console.warn('Rate limit check failed, allowing request:', error);
      // Fail open but track failures
      return { allowed: true, remaining: 100 };
    }
  },

  // Security headers for requests
  getSecurityHeaders: (): Record<string, string> => {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
    };
  },

  // Generate secure random tokens
  generateSecureToken: (length: number = 32): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Log security events
  logSecurityEvent: async (event: string, details: Record<string, any> = {}): Promise<void> => {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: 'SECURITY_EVENT',
        p_table_name: 'security_events',
        p_record_id: SecurityUtils.generateSecureToken(16),
        p_old_values: null,
        p_new_values: {
          event,
          details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href,
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  },

  // Data encryption utilities (for sensitive client-side data)
  encryptSensitiveData: async (data: string, key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyBuffer,
      encoder.encode(data)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  },

  // Data decryption utilities
  decryptSensitiveData: async (encryptedData: string, key: string): Promise<string> => {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyBuffer,
      encrypted
    );
    
    return decoder.decode(decrypted);
  },

  // Clean auth state (enhanced version)
  cleanupAuthState: (): void => {
    // Remove all auth-related items from storage
    const keysToRemove: string[] = [];
    
    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Check sessionStorage
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  },

  // CSRF token management
  generateCSRFToken: (): string => {
    const token = SecurityUtils.generateSecureToken(32);
    sessionStorage.setItem('csrf_token', token);
    return token;
  },

  validateCSRFToken: (token: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token;
  },
};

export default SecurityUtils;