/**
 * Auth Redirect URL Utilities
 * Ensures all auth redirect URLs have proper protocol and format
 */

// Production domain - single source of truth
const PRODUCTION_DOMAIN = 'monarchpropertymmgt.com';

/**
 * Get the base URL with explicit https:// protocol
 * Ensures we never have protocol-less URLs
 */
export function getAuthBaseUrl(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // If we're on the production domain, always use https
  if (origin.includes(PRODUCTION_DOMAIN)) {
    return `https://${PRODUCTION_DOMAIN}`;
  }
  
  // For localhost/development, use whatever origin we have
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }
  
  // For preview URLs (lovableproject.com), ensure https
  if (origin.includes('lovableproject.com')) {
    return origin.startsWith('https://') ? origin : origin.replace('http://', 'https://');
  }
  
  // Fallback: ensure https if no protocol
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    return `https://${origin}`;
  }
  
  return origin;
}

/**
 * Build a proper email redirect URL for signup/verification
 */
export function getEmailRedirectUrl(path: string = '/auth/verify'): string {
  const base = getAuthBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Build a proper password reset redirect URL
 */
export function getPasswordResetRedirectUrl(): string {
  return getEmailRedirectUrl('/auth/verify?type=recovery');
}

/**
 * Build a proper magic link redirect URL
 */
export function getMagicLinkRedirectUrl(): string {
  return getEmailRedirectUrl('/auth/verify?type=magiclink');
}

/**
 * Validate a redirect URL is safe to use
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow our known domains
    const allowedDomains = [
      PRODUCTION_DOMAIN,
      'lovableproject.com',
      'localhost',
      '127.0.0.1'
    ];
    
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Debug: Log current auth configuration
 * Only logs in development or when explicitly enabled
 */
export function logAuthConfig(): void {
  if (process.env.NODE_ENV === 'production' && !localStorage.getItem('DEBUG_AUTH')) {
    return;
  }
  
  const config = {
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
    currentHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
    computedBaseUrl: getAuthBaseUrl(),
    emailRedirectUrl: getEmailRedirectUrl(),
    passwordResetUrl: getPasswordResetRedirectUrl(),
    timestamp: new Date().toISOString(),
  };
  
  console.group('🔐 Auth Configuration Debug');
  console.table(config);
  console.groupEnd();
}
