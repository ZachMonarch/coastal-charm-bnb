import { logger } from './logger';

/**
 * Performance monitoring utilities for production
 * Tracks Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// Thresholds based on Web Vitals recommendations
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating for a metric value
 */
function getRating(value: number, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Track and log performance metric
 */
export function trackMetric(name: string, value: number): void {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  const rating = threshold ? getRating(value, threshold.good, threshold.poor) : 'good';
  
  const metric: PerformanceMetric = {
    name,
    value,
    rating,
    timestamp: Date.now(),
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}:`, metric);
  }

  // Log to monitoring system
  logger.info('Performance metric', { metric });

  // Send to analytics if poor performance
  if (rating === 'poor') {
    logger.warn('Poor performance detected', { metric });
  }
}

/**
 * Measure custom operation performance
 */
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      trackMetric(`custom_${operation}`, duration);
    });
  } else {
    const duration = performance.now() - start;
    trackMetric(`custom_${operation}`, duration);
    return result;
  }
}

/**
 * Track navigation timing
 */
export function trackNavigationTiming(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        // Time to First Byte
        const ttfb = perfData.responseStart - perfData.requestStart;
        trackMetric('TTFB', ttfb);

        // DOM Content Loaded
        const dcl = perfData.domContentLoadedEventEnd - perfData.fetchStart;
        trackMetric('DCL', dcl);

        // Page Load Complete
        const loadComplete = perfData.loadEventEnd - perfData.fetchStart;
        trackMetric('Load', loadComplete);

        // DNS Lookup
        const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
        trackMetric('DNS', dnsTime);

        // TCP Connection
        const tcpTime = perfData.connectEnd - perfData.connectStart;
        trackMetric('TCP', tcpTime);
      }
    }, 0);
  });
}

/**
 * Track resource loading performance
 */
export function trackResourceTiming(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Group by resource type
      const resourceGroups: Record<string, number[]> = {};
      
      resources.forEach(resource => {
        const type = resource.initiatorType || 'other';
        if (!resourceGroups[type]) resourceGroups[type] = [];
        resourceGroups[type].push(resource.duration);
      });

      // Log average load time per resource type
      Object.entries(resourceGroups).forEach(([type, durations]) => {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        logger.info('Resource timing', { 
          type, 
          avg: Math.round(avg), 
          count: durations.length 
        });
      });
    }, 0);
  });
}

/**
 * Initialize all performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  trackNavigationTiming();
  trackResourceTiming();

  logger.info('Performance monitoring initialized');
}
