import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

// Optimized lazy loading with error boundaries and loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): T {
  const LazyComponent = lazy(importFunc);
  
  return ((props: any) => (
    <GlobalErrorBoundary>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </GlobalErrorBoundary>
  )) as unknown as T;
}

// Pre-configured lazy loaders for common components
export const LazyAdminDashboard = createLazyComponent(
  () => import('@/pages/AdminDashboard')
);

export const LazyPropertyDetails = createLazyComponent(
  () => import('@/pages/PropertyDetails')
);

export const LazyVendorManagement = createLazyComponent(
  () => import('@/pages/VendorManagement')
);

export const LazyUserManagement = createLazyComponent(
  () => import('@/pages/UserManagement')
);

export const LazyBookingPage = createLazyComponent(
  () => import('@/pages/BookingPage')
);

// Preload critical components
export const preloadComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload commonly used components
    setTimeout(() => {
      import('@/pages/Properties');
      import('@/pages/PropertyDetails');
      import('@/components/PropertyCard');
    }, 1000);
  }
};