import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute (sitemap is cacheable)

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  
  const rateCheck = checkRateLimit(clientIP);
  
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60',
        } 
      }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all available properties
    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('id, title, updated_at')
      .eq('status', 'available')
      .order('id', { ascending: true });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
    }

    // Fetch all open projects (for vendor pages)
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, title, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(100);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Base URL
    const baseUrl = 'https://monarchpropertymmgt.online';
    const now = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: now },
      { loc: '/properties', changefreq: 'daily', priority: '0.9', lastmod: now },
      { loc: '/amenities', changefreq: 'weekly', priority: '0.8', lastmod: now },
      { loc: '/contact', changefreq: 'monthly', priority: '0.7', lastmod: now },
      { loc: '/vendor-application', changefreq: 'monthly', priority: '0.6', lastmod: now },
      { loc: '/services', changefreq: 'monthly', priority: '0.6', lastmod: now },
      { loc: '/gallery', changefreq: 'weekly', priority: '0.6', lastmod: now },
      { loc: '/sitemap', changefreq: 'monthly', priority: '0.4', lastmod: now },
      { loc: '/privacy', changefreq: 'yearly', priority: '0.3', lastmod: now },
      { loc: '/terms', changefreq: 'yearly', priority: '0.3', lastmod: now },
    ];

    // Generate XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}${page.loc}</loc>\n`;
      sitemap += `    <lastmod>${page.lastmod}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += '  </url>\n';
    }

    // Add property pages
    if (properties && properties.length > 0) {
      for (const property of properties) {
        const lastmod = property.updated_at
          ? new Date(property.updated_at).toISOString().split('T')[0]
          : now;
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/properties/${property.id}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += '  </url>\n';
      }
    }

    // Add project pages (limited to recent open projects for vendors)
    if (projects && projects.length > 0) {
      for (const project of projects.slice(0, 50)) {
        const lastmod = project.created_at
          ? new Date(project.created_at).toISOString().split('T')[0]
          : now;
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/vendor/projects/${project.id}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.5</priority>\n`;
        sitemap += '  </url>\n';
      }
    }

    sitemap += '</urlset>';

    console.log(`Generated sitemap with ${staticPages.length} static pages, ${properties?.length || 0} properties, and ${Math.min(projects?.length || 0, 50)} projects`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
        'X-RateLimit-Remaining': String(rateCheck.remaining),
      },
    });
  } catch (error: any) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
