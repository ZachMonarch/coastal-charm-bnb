/**
 * CSRF Protection utilities
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in memory (will be set as httpOnly cookie by backend)
 * This is more secure than sessionStorage for production use
 */
let csrfTokenCache: string | null = null;
let tokenExpiry: number | null = null;
const TOKEN_LIFETIME = 3600000; // 1 hour in milliseconds

export function storeCSRFToken(): string {
  const token = generateCSRFToken();
  csrfTokenCache = token;
  tokenExpiry = Date.now() + TOKEN_LIFETIME;
  
  // In production, this should be set as httpOnly cookie via backend endpoint
  // For now, we'll use a combination of memory cache + secure attribute
  if (typeof document !== 'undefined') {
    // Set as secure, sameSite cookie (not httpOnly - that requires backend)
    document.cookie = `${CSRF_TOKEN_KEY}=${token}; path=/; secure; samesite=strict; max-age=3600`;
  }
  
  return token;
}

/**
 * Get stored CSRF token from memory or cookie
 */
export function getCSRFToken(): string | null {
  // Check if cached token is still valid
  if (csrfTokenCache && tokenExpiry && Date.now() < tokenExpiry) {
    return csrfTokenCache;
  }
  
  // Try to get from cookie as fallback
  if (typeof document !== 'undefined') {
    const cookieMatch = document.cookie.match(new RegExp(`(^| )${CSRF_TOKEN_KEY}=([^;]+)`));
    if (cookieMatch) {
      csrfTokenCache = cookieMatch[2];
      tokenExpiry = Date.now() + TOKEN_LIFETIME;
      return cookieMatch[2];
    }
  }
  
  return null;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(providedToken: string): boolean {
  const storedToken = getCSRFToken();
  if (!storedToken || !providedToken) {
    return false;
  }
  return storedToken === providedToken;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }
  return headers;
}

/**
 * Enhanced fetch with CSRF protection
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure CSRF token exists
  let token = getCSRFToken();
  if (!token) {
    token = storeCSRFToken();
  }

  // Add CSRF token to headers for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  const requiresCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (requiresCSRF) {
    const headers = new Headers(options.headers);
    headers.set(CSRF_HEADER_NAME, token);
    
    options = {
      ...options,
      headers
    };
  }

  return fetch(url, options);
}

/**
 * Get CSRF token for forms
 */
export function getCSRFTokenForForm(): string {
  let token = getCSRFToken();
  if (!token) {
    token = storeCSRFToken();
  }
  return token;
}

/**
 * Middleware for validating CSRF on form submissions
 */
export function validateFormCSRF(formData: FormData): boolean {
  const token = formData.get('_csrf_token') as string;
  return validateCSRFToken(token);
}

/**
 * Initialize CSRF protection on app load
 */
export function initializeCSRFProtection(): void {
  // Generate initial token if none exists
  if (!getCSRFToken()) {
    storeCSRFToken();
  }

  // Clean up expired tokens on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Refresh token on page focus for security
      storeCSRFToken();
    }
  });
}