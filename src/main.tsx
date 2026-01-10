import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import UnifiedPerformanceMonitor from '@/components/UnifiedPerformanceMonitor'
import A11yProvider from '@/providers/A11yProvider'
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary'
import { initPerformanceMonitoring } from '@/utils/performanceMonitoring'
import { SessionProvider } from '@/providers/SessionProvider'
import { AuthProvider } from '@/contexts/OptimizedAuthContext'
import { setupAutoOptimizations, preloadCriticalAssets } from '@/lib/performanceOptimizations'
import QueryProvider from '@/providers/QueryProvider'
import { HelmetProvider } from 'react-helmet-async'
import { initializeCSRFProtection } from '@/utils/csrfProtection'
import { inject } from '@vercel/analytics'

// Initialize Vercel Web Analytics
inject();

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

// Defer non-critical work
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    };
    
    const windowWithIdleCallback = window as Window & { requestIdleCallback?: (callback: () => void) => void };
    if (windowWithIdleCallback.requestIdleCallback) {
      windowWithIdleCallback.requestIdleCallback(registerSW);
    } else {
      window.addEventListener('load', () => setTimeout(registerSW, 2000));
    }
  }
  
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
          <AuthProvider>
            <A11yProvider>
              <UnifiedPerformanceMonitor />
              <App />
            </A11yProvider>
          </AuthProvider>
        </SessionProvider>
      </QueryProvider>
    </HelmetProvider>
  </GlobalErrorBoundary>
);
