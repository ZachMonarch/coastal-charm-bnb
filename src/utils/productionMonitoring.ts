/**
 * Production Monitoring Utilities
 * Centralized error tracking, performance monitoring, and alerting
 */

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  level: 'error' | 'warn' | 'info';
  context?: Record<string, any>;
}

interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  url: string;
}

class ProductionMonitor {
  private static instance: ProductionMonitor;
  private errorQueue: ErrorLog[] = [];
  private performanceQueue: PerformanceAlert[] = [];
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly BATCH_INTERVAL = 10000; // 10 seconds

  private constructor() {
    if (import.meta.env.PROD) {
      this.initializeMonitoring();
    }
  }

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  private initializeMonitoring() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        level: 'error',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        level: 'error',
        context: {
          reason: String(event.reason)
        }
      });
    });

    // Start batch processing
    setInterval(() => this.flushLogs(), this.BATCH_INTERVAL);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flushLogs());
  }

  logError(error: ErrorLog) {
    this.errorQueue.push(error);
    
    // Also log to localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('production-errors') || '[]');
      errors.push(error);
      if (errors.length > this.MAX_QUEUE_SIZE) errors.shift();
      localStorage.setItem('production-errors', JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }

    // If queue is full, flush immediately
    if (this.errorQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushLogs();
    }
  }

  logPerformanceAlert(alert: PerformanceAlert) {
    this.performanceQueue.push(alert);

    // If queue is full, flush immediately
    if (this.performanceQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushLogs();
    }
  }

  private async flushLogs() {
    if (this.errorQueue.length === 0 && this.performanceQueue.length === 0) {
      return;
    }

    const payload = {
      errors: [...this.errorQueue],
      performanceAlerts: [...this.performanceQueue],
      timestamp: Date.now()
    };

    // Clear queues
    this.errorQueue = [];
    this.performanceQueue = [];

    try {
      // Send to monitoring endpoint (replace with your actual endpoint)
      await fetch('/api/monitoring/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // Ensures request completes even if page unloads
      });
    } catch (error) {
      // Log to console as fallback
      console.error('Failed to send monitoring data:', error);
    }
  }

  // Check if metrics exceed thresholds
  checkPerformanceThresholds() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const thresholds = {
      LCP: 2500, // 2.5s
      FCP: 1800, // 1.8s
      TTFB: 800,  // 800ms
      domComplete: 5000 // 5s
    };

    // Check TTFB
    const ttfb = navigation.responseStart - navigation.requestStart;
    if (ttfb > thresholds.TTFB) {
      this.logPerformanceAlert({
        metric: 'TTFB',
        value: ttfb,
        threshold: thresholds.TTFB,
        timestamp: Date.now(),
        url: window.location.href
      });
    }

    // Check DOM Complete
    const domComplete = navigation.domComplete - navigation.fetchStart;
    if (domComplete > thresholds.domComplete) {
      this.logPerformanceAlert({
        metric: 'DOM_COMPLETE',
        value: domComplete,
        threshold: thresholds.domComplete,
        timestamp: Date.now(),
        url: window.location.href
      });
    }
  }

  // Get stored errors for debugging
  getStoredErrors(): ErrorLog[] {
    try {
      return JSON.parse(localStorage.getItem('production-errors') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors() {
    try {
      localStorage.removeItem('production-errors');
      localStorage.removeItem('web-vitals');
    } catch {
      // Ignore
    }
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance();

// Utility functions
export const logProductionError = (
  message: string,
  error?: Error,
  context?: Record<string, any>
) => {
  productionMonitor.logError({
    message,
    stack: error?.stack,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    level: 'error',
    context
  });
};

export const logProductionWarning = (
  message: string,
  context?: Record<string, any>
) => {
  productionMonitor.logError({
    message,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    level: 'warn',
    context
  });
};
