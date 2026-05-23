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
import { SpeedInsights } from '@vercel/speed-insights/react'

// Initialize Vercel Web Analytics only on Vercel-hosted domains
// This prevents 404 errors on Lovable preview domains
const isVercelHosted = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('.vercel.app') ||
  window.location.hostname === 'monarchpropertymmgt.online' ||
  window.location.hostname.endsWith('monarchpropertymmgt.online')
);

if (isVercelHosted) {
  inject();
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

// Defer non-critical work - use VitePWA's service worker only (no custom SW registration)
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Production monitoring - defer until idle
  const windowWithIdleCallback = window as Window & { requestIdleCallback?: (callback: () => void) => void };
  const deferWork = (fn: () => void) => {
    if (windowWithIdleCallback.requestIdleCallback) {
      windowWithIdleCallback.requestIdleCallback(fn);
    } else {
      window.addEventListener('load', () => setTimeout(fn, 3000));
    }
  };
  
  deferWork(() => {
    import('@/utils/productionMonitoring').then(({ productionMonitor }) => {
      productionMonitor.checkPerformanceThresholds();
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <HelmetProvider>
      <QueryProvider>
        <SessionProvider>
          <AuthProvider>
            <A11yProvider>
              <UnifiedPerformanceMonitor />
              <SpeedInsights />
              <App />
            </A11yProvider>
          </AuthProvider>
        </SessionProvider>
      </QueryProvider>
    </HelmetProvider>
  </GlobalErrorBoundary>
);
