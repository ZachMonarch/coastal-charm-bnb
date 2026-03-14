import { Helmet } from "react-helmet-async";
import {
  OrganizationSchema,
  LocalBusinessSchema,
  WebSiteSchema,
} from "./StructuredData";

/**
 * Enhanced SEO Component with Complete Meta Tags
 * 
 * Features:
 * - Open Graph (Facebook, LinkedIn)
 * - Twitter Cards
 * - Canonical URLs
 * - JSON-LD Structured Data
 * - Responsive meta tags
 * 
 * @see Phase 3 Documentation
 */

export interface EnhancedSEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
  nofollow?: boolean;
  includeOrganizationSchema?: boolean;
  includeLocalBusinessSchema?: boolean;
  includeWebSiteSchema?: boolean;
}

export function EnhancedSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = "https://monarchpropertymmgt.online/og-image.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  noindex = false,
  nofollow = false,
  includeOrganizationSchema = false,
  includeLocalBusinessSchema = false,
  includeWebSiteSchema = false,
}: EnhancedSEOProps) {
  const fullTitle = title.includes("Monarch")
    ? title
    : `${title} | Monarch Property Management`;
  
  const canonicalUrl =
    canonical || `https://monarchpropertymmgt.online${window.location.pathname}`;

  const robots = [];
  if (noindex) robots.push("noindex");
  if (nofollow) robots.push("nofollow");
  const robotsContent = robots.length > 0 ? robots.join(", ") : "index, follow";

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Monarch Property Management" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:site" content="@monarchproperty" />

        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#E87722" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />

        {/* Mobile Optimization */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </Helmet>

      {/* Structured Data */}
      {includeOrganizationSchema && <OrganizationSchema />}
      {includeLocalBusinessSchema && <LocalBusinessSchema />}
      {includeWebSiteSchema && <WebSiteSchema />}
    </>
  );
}

/**
 * Homepage SEO
 */
export function HomePageSEO() {
  return (
    <EnhancedSEO
      title="Premier Property Management Services"
      description="Professional property management with premium standards and personalized care. Residential & commercial properties in Colorado. 500+ properties, 98% satisfaction."
      keywords="property management, colorado property management, residential management, commercial properties, franktown property management"
      includeOrganizationSchema
      includeLocalBusinessSchema
      includeWebSiteSchema
    />
  );
}

/**
 * Properties Page SEO
 */
export function PropertiesPageSEO() {
  return (
    <EnhancedSEO
      title="Properties for Rent & Sale"
      description="Browse our curated selection of luxury apartments, townhouses, and commercial properties. Professional management with 24/7 support."
      keywords="properties for rent, apartments for rent, colorado rentals, luxury apartments, townhouses"
      canonical="https://monarchpropertymmgt.online/properties"
    />
  );
}

/**
 * Services Page SEO
 */
export function ServicesPageSEO() {
  return (
    <EnhancedSEO
      title="Professional Property Management Services"
      description="Comprehensive property management services including tenant screening, maintenance, rent collection, and 24/7 support. Trusted by property owners."
      keywords="property management services, tenant screening, property maintenance, rent collection, property consultation"
      canonical="https://monarchpropertymmgt.online/services"
    />
  );
}
