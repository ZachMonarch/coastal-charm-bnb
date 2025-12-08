// Performance optimization utilities
export const performanceOptimizer = {
  // Debounce function for search inputs and API calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll events and frequent operations
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Memoization for expensive calculations
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Intersection Observer for lazy loading
  createIntersectionObserver: (
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return null;
    }
    
    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px',
      threshold: 0.1,
      ...options,
    });
  },

  // Batch DOM updates for better performance
  batchDOMUpdates: (updates: (() => void)[]) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Critical resource preloading only
  preloadCriticalResource: (url: string, type: 'script' | 'style' | 'image' = 'script') => {
    if (typeof window === 'undefined') return;
    
    // Only preload if critical
    if (!url.includes('critical') && !url.includes('above-fold')) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    document.head.appendChild(link);
  },

  // Virtual scrolling helper for large lists
  calculateVisibleItems: (
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 3
  ) => {
    const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleEnd = Math.min(
      totalItems - 1,
      visibleStart + Math.ceil(containerHeight / itemHeight) + overscan
    );
    
    return { start: visibleStart, end: visibleEnd };
  },

  // Aggressive image optimization
  optimizeImageUrl: (url: string, width?: number, height?: number, quality: number = 50) => {
    if (!url) return '';
    
    // Apply aggressive optimization for bandwidth savings
    const params = new URLSearchParams();
    if (width) params.set('w', Math.min(width, 800).toString()); // Cap at 800px
    if (height) params.set('h', Math.min(height, 600).toString()); // Cap at 600px
    params.set('q', quality.toString()); // Lower quality
    params.set('f', 'webp'); // Force WebP format
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  },

  // Performance monitoring
  measurePerformance: <T>(name: string, fn: () => T): T => {
    if (typeof window === 'undefined' || !window.performance) {
      return fn();
    }
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') {
      console.log(`Performance [${name}]: ${end - start}ms`);
    }
    
    return result;
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return null;
    }
    
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
};