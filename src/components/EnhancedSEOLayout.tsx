import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEOHead } from './SEOHead';
import { SecurityHeaders } from './SecurityHeaders';

interface EnhancedSEOLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'product' | 'profile';
  schemaType?: 'Organization' | 'LocalBusiness' | 'RealEstateAgent';
}

export const EnhancedSEOLayout: React.FC<EnhancedSEOLayoutProps> = ({
  children,
  title,
  description,
  keywords = [],
  canonical,
  noIndex = false,
  type = 'website',
  schemaType = 'Organization'
}) => {
  const baseKeywords = [
    'property management',
    'luxury rentals',
    'vendor services',
    'real estate',
    'property investment',
    'maintenance services',
    'tenant management',
    'property portfolio',
    'commercial properties',
    'residential properties'
  ];

  const combinedKeywords = [...baseKeywords, ...keywords];

  return (
    <>
      <SecurityHeaders />
      <SEOHead
        title={title}
        description={description}
        keywords={combinedKeywords}
        url={canonical}
        type={type}
        noIndex={noIndex}
      />
      
      <Helmet>
        {/* Advanced SEO Meta Tags */}
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        <meta name="ICBM" content="40.7128, -74.0060" />
        <meta name="geo.position" content="40.7128;-74.0060" />
        
        {/* Business Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': schemaType,
            name: 'Monarch Property Management',
            description: 'Premier property management and vendor services platform',
            url: typeof window !== 'undefined' ? window.location.origin : '',
            logo: `${typeof window !== 'undefined' ? window.location.origin : ''}/og-image.png`,
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+1-555-MONARCH',
              contactType: 'customer service',
              availableLanguage: ['English', 'Spanish'],
              serviceArea: {
                '@type': 'Country',
                name: 'United States'
              }
            },
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'US',
              addressRegion: 'NY'
            },
            sameAs: [
              'https://twitter.com/MonarchProperty',
              'https://linkedin.com/company/monarch-property',
              'https://facebook.com/MonarchProperty'
            ],
            ...(schemaType === 'LocalBusiness' && {
              openingHours: 'Mo-Fr 08:00-18:00',
              priceRange: '$$',
              paymentAccepted: ['Cash', 'Credit Card', 'Wire Transfer'],
              currenciesAccepted: 'USD'
            }),
            ...(schemaType === 'RealEstateAgent' && {
              knowsAbout: [
                'Property Management',
                'Real Estate Investment',
                'Tenant Relations',
                'Property Maintenance',
                'Vendor Coordination'
              ]
            })
          })}
        </script>

        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: typeof window !== 'undefined' ? window.location.origin : ''
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Property Management',
                item: `${typeof window !== 'undefined' ? window.location.origin : ''}/properties`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Vendor Services',
                item: `${typeof window !== 'undefined' ? window.location.origin : ''}/vendor-application`
              }
            ]
          })}
        </script>

        {/* FAQ Schema for common property management questions */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What services does Monarch Property Management offer?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We offer comprehensive property management services including tenant screening, rent collection, maintenance coordination, vendor management, and property investment consulting.'
                }
              },
              {
                '@type': 'Question',
                name: 'How do I become a verified vendor?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'To become a verified vendor, complete our application process, provide insurance documentation, pass background checks, and demonstrate expertise in your service area.'
                }
              },
              {
                '@type': 'Question',
                name: 'What types of properties do you manage?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We manage residential properties including apartments, condos, single-family homes, as well as commercial properties and mixed-use developments.'
                }
              }
            ]
          })}
        </script>

        {/* Service Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Property Management Services',
            provider: {
              '@type': 'Organization',
              name: 'Monarch Property Management'
            },
            serviceType: 'Property Management',
            description: 'Comprehensive property management services for residential and commercial properties',
            areaServed: {
              '@type': 'Country',
              name: 'United States'
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Property Management Services',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Tenant Management',
                    description: 'Complete tenant screening, leasing, and relationship management'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Maintenance Coordination',
                    description: 'Professional maintenance and repair services through our verified vendor network'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Financial Management',
                    description: 'Rent collection, financial reporting, and investment analysis'
                  }
                }
              ]
            }
          })}
        </script>

        {/* Performance optimizations - fonts loaded via Google Fonts in index.html */}
        
        {/* Resource hints centralized in index.html - no duplicates here */}
        
        {/* Critical CSS inlining hint */}
        <style>{`
          .critical-loading{opacity:0;transform:translateY(20px);transition:all 0.3s ease}
          .critical-loaded{opacity:1;transform:translateY(0)}
        `}</style>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </>
  );
};