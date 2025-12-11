// Shared CORS configuration for all edge functions
// Production domains only - NO wildcard in production

const ALLOWED_ORIGINS = [
  'https://monarchpropertymmgt.com',
  'https://www.monarchpropertymmgt.com',
  // Add Vercel preview domains pattern
  'https://monarch-property-management.lovable.app',
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

// Check if origin is allowed
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Check Vercel preview pattern
  if (origin.match(/^https:\/\/[a-z0-9-]+\.vercel\.app$/)) return true;
  
  // Check Lovable preview pattern
  if (origin.match(/^https:\/\/[a-z0-9-]+\.lovable\.app$/)) return true;
  
  return false;
}

// Get CORS headers for a request
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  
  // In production, only allow specific origins
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// Handle CORS preflight requests
export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }
  return null;
}

// Legacy export for backward compatibility (will be deprecated)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
