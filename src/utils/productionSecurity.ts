/**
 * Production security utilities and enhancements
 */

import { supabase } from '@/integrations/supabase/client';
import { maskPropertyData, sanitizeFormData } from './dataMasking';
import { initializeCSRFProtection, addCSRFHeaders } from './csrfProtection';

/**
 * Security configuration for production
 */
export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  passwordMinLength: 8,
  requireStrongPassword: true,
  enableBruteForceProtection: true,
  logSecurityEvents: true
};

/**
 * Initialize production security measures
 */
export function initializeProductionSecurity(): void {
  // Initialize CSRF protection
  initializeCSRFProtection();
  
  // Set up security headers
  setupSecurityHeaders();
  
  // Initialize session monitoring
  initializeSessionMonitoring();
  
  // Set up content security policy
  setupContentSecurityPolicy();
}

/**
 * Set up security headers
 */
function setupSecurityHeaders(): void {
  // Add security meta tags if not present
  const securityHeaders = [
    { name: 'X-Content-Type-Options', content: 'nosniff' },
    { name: 'X-Frame-Options', content: 'DENY' },
    { name: 'X-XSS-Protection', content: '1; mode=block' },
    { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
  ];

  securityHeaders.forEach(({ name, content }) => {
    if (!document.querySelector(`meta[http-equiv="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  });
}

/**
 * Set up Content Security Policy
 */
function setupContentSecurityPolicy(): void {
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', csp);
    document.head.appendChild(meta);
  }
}

/**
 * Enhanced session monitoring with security features
 */
function initializeSessionMonitoring(): void {
  let lastActivity = Date.now();
  let suspiciousActivityCount = 0;
  let isTabVisible = !document.hidden;
  
  // Track user activity with security monitoring
  const updateActivity = (event: Event) => {
    lastActivity = Date.now();
    
    // Monitor for suspicious rapid-fire events
    const now = Date.now();
    if (now - lastActivity < 10) { // Less than 10ms between events
      suspiciousActivityCount++;
      if (suspiciousActivityCount > 50) {
        logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
          eventType: event.type,
          rapidFireCount: suspiciousActivityCount,
          userAgent: navigator.userAgent
        }, 'high');
        suspiciousActivityCount = 0; // Reset counter
      }
    } else {
      suspiciousActivityCount = Math.max(0, suspiciousActivityCount - 1);
    }
  };
  
  // Enhanced activity tracking
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, updateActivity, true);
  });
  
  // Monitor tab visibility for security
  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) {
      lastActivity = Date.now(); // Reset activity when tab becomes visible
    }
  });
  
  // Enhanced session timeout with warnings
  setInterval(async () => {
    const timeSinceActivity = Date.now() - lastActivity;
    const warningTime = SECURITY_CONFIG.sessionTimeout - (5 * 60 * 1000); // 5 minutes before timeout
    
    if (timeSinceActivity > warningTime && timeSinceActivity < SECURITY_CONFIG.sessionTimeout) {
      // Show warning before timeout
      if (isTabVisible) {
        const remaining = Math.ceil((SECURITY_CONFIG.sessionTimeout - timeSinceActivity) / 60000);
        console.warn(`Session will expire in ${remaining} minutes due to inactivity`);
      }
    } else if (timeSinceActivity > SECURITY_CONFIG.sessionTimeout) {
      // Log security event before logout
      await logSecurityEvent('SESSION_TIMEOUT', {
        inactivityDuration: timeSinceActivity,
        lastActivity: new Date(lastActivity).toISOString()
      }, 'medium');
      
      // Auto-logout for security
      await supabase.auth.signOut();
      window.location.href = '/auth?reason=timeout';
    }
  }, 60000); // Check every minute
}

/**
 * Secure API request wrapper
 */
export async function secureApiRequest(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Add CSRF protection
  addCSRFHeaders(Object.fromEntries(headers.entries()));
  
  // Add security headers
  headers.set('X-Requested-With', 'XMLHttpRequest');
  
  if (requireAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  return fetch(endpoint, {
    ...options,
    headers
  });
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  if (!SECURITY_CONFIG.logSecurityEvents) return;
  
  try {
    await supabase.rpc('log_security_audit', {
      p_event_type: eventType,
      p_severity: severity,
      p_details: {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });
  } catch (error) {
    // Silent fail for security logging
    console.error('Failed to log security event:', error);
  }
}

/**
 * Validate user input against common attack patterns
 */
export function validateUserInput(input: string): { isValid: boolean; reason?: string } {
  if (!input) return { isValid: true };
  
  // Check for SQL injection patterns
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi;
  if (sqlPatterns.test(input)) {
    return { isValid: false, reason: 'Potential SQL injection detected' };
  }
  
  // Check for XSS patterns
  const xssPatterns = /<script|javascript:|onload=|onerror=/gi;
  if (xssPatterns.test(input)) {
    return { isValid: false, reason: 'Potential XSS attack detected' };
  }
  
  // Check for path traversal
  const pathTraversalPatterns = /\.\.\/|\.\.\\|%2e%2e/gi;
  if (pathTraversalPatterns.test(input)) {
    return { isValid: false, reason: 'Potential path traversal detected' };
  }
  
  return { isValid: true };
}

/**
 * Enhanced property data fetching with security
 */
export async function fetchSecurePropertyData(
  isAuthenticated: boolean = false,
  userRole?: string
): Promise<any[]> {
  try {
    // Use safe_property_listings view to avoid exposing sensitive data (owner_id, coordinates)
    const { data, error } = await supabase
      .from('safe_property_listings')
      .select('id, title, description, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet, property_type, status, image_urls, amenities')
      .order('id', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    // Apply data masking for security
    return (data || []).map(property => 
      maskPropertyData(property, isAuthenticated, userRole)
    );
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}