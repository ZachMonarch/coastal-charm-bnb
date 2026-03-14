import { Helmet } from "react-helmet-async";

/**
 * Structured Data Component for SEO
 * 
 * Implements JSON-LD structured data for better search engine understanding.
 * Supports multiple schema.org types for rich snippets and knowledge graphs.
 * 
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

type SchemaType =
  | "Organization"
  | "LocalBusiness"
  | "FAQPage"
  | "Product"
  | "RealEstateAgent"
  | "Apartment"
  | "BreadcrumbList"
  | "WebSite";

export interface StructuredDataProps {
  type: SchemaType;
  data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * Organization Schema (Homepage)
 */
export function OrganizationSchema() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: "Monarch Property Management",
        description:
          "Professional property management services with premium standards and personalized care for investment properties.",
        url: "https://monarchpropertymmgt.online",
        logo: "https://monarchpropertymmgt.online/og-image.png",
        address: {
          "@type": "PostalAddress",
          streetAddress: "2195 N. Highway 83 Suite 14B",
          addressLocality: "Franktown",
          addressRegion: "CO",
          postalCode: "80116",
          addressCountry: "US",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+1-304-365-8349",
          contactType: "Customer Service",
          areaServed: "US",
          availableLanguage: ["en", "it"],
        },
        sameAs: [
          "https://www.facebook.com/monarchpropertymanagement",
          "https://www.linkedin.com/company/monarch-property-management",
          "https://twitter.com/monarchproperty",
          "https://www.instagram.com/monarchproperty",
        ],
      }}
    />
  );
}

/**
 * LocalBusiness Schema
 */
export function LocalBusinessSchema() {
  return (
    <StructuredData
      type="LocalBusiness"
      data={{
        name: "Monarch Property Management",
        image: "https://monarchpropertymmgt.online/og-image.png",
        telephone: "+1-304-365-8349",
        email: "support@monarchpropertymmgt.online",
        address: {
          "@type": "PostalAddress",
          streetAddress: "2195 N. Highway 83 Suite 14B",
          addressLocality: "Franktown",
          addressRegion: "CO",
          postalCode: "80116",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 39.3528,
          longitude: -104.7512,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "09:00",
            closes: "17:00",
          },
        ],
        priceRange: "$$",
      }}
    />
  );
}

/**
 * FAQ Page Schema
 */
export function FAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return (
    <StructuredData
      type="FAQPage"
      data={{
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

/**
 * Real Estate Listing Schema
 */
export function RealEstateListingSchema({
  name,
  description,
  image,
  address,
  price,
  bedrooms,
  bathrooms,
  floorSize,
}: {
  name: string;
  description: string;
  image: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  floorSize?: number;
}) {
  return (
    <StructuredData
      type="Apartment"
      data={{
        name,
        description,
        image,
        address: {
          "@type": "PostalAddress",
          streetAddress: address.street,
          addressLocality: address.city,
          addressRegion: address.state,
          postalCode: address.zip,
          addressCountry: "US",
        },
        numberOfRooms: bedrooms,
        numberOfBathroomsTotal: bathrooms,
        floorSize: floorSize
          ? {
              "@type": "QuantitativeValue",
              value: floorSize,
              unitCode: "FTK",
            }
          : undefined,
        offers: {
          "@type": "Offer",
          price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      }}
    />
  );
}

/**
 * Breadcrumb Schema
 */
export function BreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      }}
    />
  );
}

/**
 * Website Search Schema
 */
export function WebSiteSchema() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: "Monarch Property Management",
        url: "https://monarchpropertymmgt.online",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://monarchpropertymmgt.online/properties?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}
