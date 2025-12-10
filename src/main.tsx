import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import UnifiedPerformanceMonitor from '@/components/UnifiedPerformanceMonitor'
import A11yProvider from '@/providers/A11yProvider'
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary'
import { initPerformanceMonitoring } from '@/utils/performanceMonitoring'
import { SessionProvider } from '@/providers/SessionProvider'
import { setupAutoOptimizations, preloadCriticalAssets } from '@/lib/performanceOptimizations'
import QueryProvider from '@/providers/QueryProvider'
import { HelmetProvider } from 'react-helmet-async'
import { initializeCSRFProtection } from '@/utils/csrfProtection'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Initialize Vercel Speed Insights for client-side performance monitoring
// Must be called as early as possible on the client side
if (typeof window !== 'undefined') {
  injectSpeedInsights();
}

// Initialize performance optimizations immediately
setupAutoOptimizations();
preloadCriticalAssets();

// Initialize CSRF protection
if (typeof document !== 'undefined') {
  initializeCSRFProtection();
}

// Initialize performance monitoring in production
if (import.meta.env.PROD) {
  initPerformanceMonitoring();
}

// Performance optimizations - Defer all non-critical work
if (typeof window !== 'undefined') {
  // Defer Service Worker registration until page is fully loaded and idle
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    // Use requestIdleCallback or fallback to setTimeout to avoid blocking critical path
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - continue without it
      });
    };
    
    const windowWithIdleCallback = window as Window & { requestIdleCallback?: (callback: () => void) => void };
    if (windowWithIdleCallback.requestIdleCallback) {
      windowWithIdleCallback.requestIdleCallback(registerSW);
    } else {
      window.addEventListener('load', () => setTimeout(registerSW, 2000));
    }
  }
  
  // Initialize production monitoring after page is interactive
  if (import.meta.env.PROD) {
    const windowWithIdleCallback = window as Window & { requestIdleCallback?: (callback: () => void) => void };
    if (windowWithIdleCallback.requestIdleCallback) {
      windowWithIdleCallback.requestIdleCallback(() => {
        import('@/utils/productionMonitoring').then(({ productionMonitor }) => {
          productionMonitor.checkPerformanceThresholds();
        });
      });
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          import('@/utils/productionMonitoring').then(({ productionMonitor }) => {
            productionMonitor.checkPerformanceThresholds();
          });
        }, 3000);
      });
    }
  }
}

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <HelmetProvider>
      <QueryProvider>
        <SessionProvider>
          <A11yProvider>
            <UnifiedPerformanceMonitor />
            <App />
          </A11yProvider>
        </SessionProvider>
      </QueryProvider>
    </HelmetProvider>
  </GlobalErrorBoundary>
);
