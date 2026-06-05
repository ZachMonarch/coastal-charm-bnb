import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  price?: {
    amount: number;
    currency: string;
  };
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: {
    value: number;
    count: number;
  };
  locale?: string;
  noIndex?: boolean;
}

const defaultProps: Required<Pick<SEOProps, 'title' | 'description' | 'siteName' | 'type' | 'locale'>> = {
  title: 'Monarch Property Management - Premier Property & Vendor Services',
  description: 'Professional property management, luxury rentals, and verified vendor services. Streamline your property investments with our comprehensive platform.',
  siteName: 'Monarch Property Management',
  type: 'website',
  locale: 'en_US'
};

export const SEOHead: React.FC<SEOProps> = ({
  title = defaultProps.title,
  description = defaultProps.description,
  keywords = [],
  image,
  url,
  type = defaultProps.type,
  siteName = defaultProps.siteName,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  price,
  availability,
  rating,
  locale = defaultProps.locale,
  noIndex = false
}) => {
  const fullTitle = title === defaultProps.title ? title : `${title} | ${siteName}`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const defaultImage = 'https://monarchpropertymmgt.online/og-image.png';
  const seoImage = image || defaultImage;

  // Generate structured data
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'website' ? 'Organization' : 'WebPage',
      name: siteName,
      description,
      url: currentUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/og-image.png`
      }
    };

    if (type === 'product' && price) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description,
        image: seoImage,
        offers: {
          '@type': 'Offer',
          price: price.amount,
          priceCurrency: price.currency,
          availability: `https://schema.org/${availability || 'InStock'}`,
          url: currentUrl
        },
        ...(rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.value,
            reviewCount: rating.count
          }
        })
      };
    }

    if (type === 'article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image: seoImage,
        author: {
          '@type': 'Person',
          name: author || siteName
        },
        publisher: {
          '@type': 'Organization',
          name: siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${window.location.origin}/og-image.png`
          }
        },
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': currentUrl
        }
      };
    }

    if (type === 'profile') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: title,
        description,
        image: seoImage,
        url: currentUrl
      };
    }

    return baseData;
  };

  const combinedKeywords = [
    'property management',
    'luxury rentals',
    'vendor services',
    'real estate',
    'property investment',
    'maintenance services',
    ...keywords,
    ...tags
  ].filter(Boolean).join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {combinedKeywords && <meta name="keywords" content={combinedKeywords} />}
      {author && <meta name="author" content={author} />}
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="bingbot" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      
      {/* Canonical URL - managed by useCanonicalUrl hook in pages */}
      
      {/* Enhanced SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content={siteName} />
      <meta name="msapplication-TileColor" content="#D97743" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Performance & Loading - preconnect hints are in index.html, no duplicates here */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content={locale} />
      
      {/* Article specific */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@MonarchProperty" />
      <meta name="twitter:creator" content="@MonarchProperty" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#D97743" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Font loading handled in index.html to avoid duplicate preconnects */}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(getStructuredData())}
      </script>
      
      {/* Additional structured data for organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteName,
          url: currentUrl.split('/').slice(0, 3).join('/'),
          logo: `${currentUrl.split('/').slice(0, 3).join('/')}/og-image.png`,
          sameAs: [
            'https://twitter.com/MonarchProperty',
            'https://linkedin.com/company/monarch-property',
            'https://facebook.com/MonarchProperty'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-MONARCH',
            contactType: 'customer service',
            availableLanguage: ['English', 'Spanish']
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'US'
          }
        })}
      </script>
    </Helmet>
  );
};