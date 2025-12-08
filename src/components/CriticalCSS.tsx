import { useEffect } from 'react';
import logo48 from '@/assets/cdn/ui/monarch-logo-48.webp';
import heroImage from '@/assets/hero-image.jpg';
import heroImageWebP from '@/assets/hero-image-new.webp';

// Critical CSS component that loads non-critical styles asynchronously
export default function CriticalCSS() {
  useEffect(() => {
    // CSS is now deferred via inline script in index.html for faster performance
    // This component now handles only resource preloading
    
    // Use requestIdleCallback for non-critical resource loading
    const scheduleNonCriticalLoading = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback);
      } else {
        setTimeout(callback, 50);
      }
    };

    // Secondary image preloading after idle
    scheduleNonCriticalLoading(() => {
      const secondaryImages = [logo48];
      
      secondaryImages.forEach((src) => {
        const link = document.createElement('link');
        link.rel = 'prefetch'; // Use prefetch instead of preload for lower priority
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
    });

  }, []);

  // Critical CSS is now in index.html for faster delivery
  // This component no longer needs to inject duplicate styles
  return null;
}