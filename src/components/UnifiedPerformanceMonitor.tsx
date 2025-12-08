import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { logger } from '@/utils/logger';

/**
 * Unified Performance Monitor
 * Consolidates all performance monitoring into a single component:
 * - Web Vitals tracking (LCP, FID, CLS, INP, TTFB)
 * - Resource hints (preconnect, dns-prefetch)
 * - Scroll optimization
 * - Critical CSS
 * 
 * Replaces: PerformanceMonitor, PerformanceOptimizer, PerformanceOptimizedApp,
 *           ProductionOptimizations, WebVitalsTracker
 */
export default function UnifiedPerformanceMonitor() {
  useEffect(() => {
    // ============================================================
    // 1. WEB VITALS TRACKING (Consolidated from 3 components)
    // ============================================================
    if ('PerformanceObserver' in window) {
      const observers: PerformanceObserver[] = [];

      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const lcpValue = lastEntry?.renderTime || lastEntry?.loadTime;
          
          if (lcpValue) {
            logger.info('[Web Vitals] LCP', { 
              value: lcpValue, 
              rating: lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor',
              target: '< 2.5s (good) | 2.5s-4s (needs improvement) | > 4s (poor)'
            });
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observers.push(lcpObserver);

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart) {
              const fidValue = entry.processingStart - entry.startTime;
              logger.info('[Web Vitals] FID', { 
                value: fidValue, 
                rating: fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor',
                target: '< 100ms (good) | 100ms-300ms (needs improvement) | > 300ms (poor)'
              });
            }
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observers.push(fidObserver);

        // Cumulative Layout Shift (CLS)
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });
          
          logger.info('[Web Vitals] CLS', { 
            value: clsScore, 
            rating: clsScore < 0.1 ? 'good' : clsScore < 0.25 ? 'needs-improvement' : 'poor',
            target: '< 0.1 (good) | 0.1-0.25 (needs improvement) | > 0.25 (poor)'
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observers.push(clsObserver);

        // Interaction to Next Paint (INP) - replaces FID
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.duration) {
              logger.info('[Web Vitals] INP', { 
                value: entry.duration, 
                rating: entry.duration < 200 ? 'good' : entry.duration < 500 ? 'needs-improvement' : 'poor',
                target: '< 200ms (good) | 200ms-500ms (needs improvement) | > 500ms (poor)'
              });
            }
          });
        });
        inpObserver.observe({ type: 'event', buffered: true });
        observers.push(inpObserver);

        // Time to First Byte (TTFB)
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          const navEntry = navEntries[0] as PerformanceNavigationTiming;
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          if (ttfb > 0) {
            logger.info('[Web Vitals] TTFB', { 
              value: `${ttfb.toFixed(2)}ms`, 
              rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
              target: '< 800ms (good) | 800ms-1.8s (needs improvement) | > 1.8s (poor)'
            });
          }
        }
      } catch (error) {
        logger.warn('Web Vitals tracking not available:', error);
      }

      // ============================================================
      // 2. SCROLL OPTIMIZATION (From PerformanceOptimizer)
      // ============================================================
      let ticking = false;
      const optimizeScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', optimizeScroll, { passive: true });

      // ============================================================
      // 3. PERFORMANCE NAVIGATION TIMING
      // ============================================================
      const trackNavigationTiming = () => {
        if ('performance' in window && 'getEntriesByType' in performance) {
          const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          
          if (navigation) {
            const metrics = {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              ttfb: navigation.responseStart - navigation.requestStart,
              download: navigation.responseEnd - navigation.responseStart,
              domInteractive: navigation.domInteractive - navigation.fetchStart,
              domComplete: navigation.domComplete - navigation.fetchStart,
              loadComplete: navigation.loadEventEnd - navigation.fetchStart
            };

            logger.debug('[Performance Timing]', metrics);
          }
        }
      };

      if (document.readyState === 'complete') {
        trackNavigationTiming();
      } else {
        window.addEventListener('load', trackNavigationTiming);
      }

      // Cleanup
      return () => {
        observers.forEach(observer => observer.disconnect());
        window.removeEventListener('scroll', optimizeScroll);
        window.removeEventListener('load', trackNavigationTiming);
      };
    }
  }, []);

  return (
    <Helmet>
      {/* DNS Prefetch and Preconnect for faster connections */}
      <link rel="dns-prefetch" href="https://yhegaaqxmuhszesbjtdo.supabase.co" />
      <link rel="preconnect" href="https://yhegaaqxmuhszesbjtdo.supabase.co" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Critical CSS optimization */}
      <style>{`
        /* Critical above-the-fold styles */
        .hero-section { transform: translateZ(0); }
        .property-card { backface-visibility: hidden; }
        
        /* Reduce layout shifts */
        img[loading="lazy"] { min-height: 200px; }
        
        /* Optimize animations for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </Helmet>
  );
}
