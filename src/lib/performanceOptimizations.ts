/**
 * Performance optimization utilities for Monarch Property Management
 * Target: LCP < 2.5s, CLS < 0.1, INP < 200ms
 */

/**
 * Preload critical assets - only existing assets to prevent 404s
 */
export const preloadCriticalAssets = () => {
  // Fonts are loaded via Google Fonts in index.html with display=optional
  // No need to preload them separately to avoid 404 errors
  // This function is kept for future critical asset preloading
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      const image = img as HTMLImageElement;
      image.src = image.dataset.src!;
    });
  }
};

/**
 * Defer non-critical JavaScript
 */
export const deferNonCriticalJS = (callback: () => void, delay = 0) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout: delay + 2000 });
  } else {
    setTimeout(callback, delay);
  }
};

/**
 * Optimize bundle with code splitting hints
 */
export const prefetchRoute = (route: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
};

/**
 * Monitor Core Web Vitals and auto-optimize
 */
export const setupAutoOptimizations = () => {
  // Reduce motion for users who prefer it
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-duration', '0ms');
  }

  // Enable font display swap for faster text rendering
  const fonts = document.querySelectorAll('link[rel="stylesheet"]');
  fonts.forEach(font => {
    (font as HTMLLinkElement).crossOrigin = 'anonymous';
  });

  // Preconnect to critical domains
  const criticalDomains = [
    'https://yhegaaqxmuhszesbjtdo.supabase.co',
  ];

  criticalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};
