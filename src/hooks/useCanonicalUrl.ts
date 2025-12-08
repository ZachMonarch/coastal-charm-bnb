import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage canonical URLs dynamically
 * Removes the need for static canonical tags in index.html
 */
export function useCanonicalUrl(customUrl?: string) {
  const location = useLocation();
  
  useEffect(() => {
    // Get or create canonical link element
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    
    // Set canonical URL
    const baseUrl = 'https://monarchpropertymmgt.com';
    const canonicalUrl = customUrl || `${baseUrl}${location.pathname}`;
    
    canonicalLink.href = canonicalUrl;
    
    // Cleanup function
    return () => {
      // Keep the canonical link but will be updated on next mount
    };
  }, [location.pathname, customUrl]);
}
