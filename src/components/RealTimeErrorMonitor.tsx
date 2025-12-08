import { useEffect } from 'react';
import { toast } from 'sonner';

interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
}

export default function RealTimeErrorMonitor() {
  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event);
      
      // Only show user-facing errors for critical issues
      if (event.message && !event.message.includes('ResizeObserver') && !event.message.includes('Non-Error promise rejection')) {
        toast.error('An unexpected error occurred');
      }
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Only show user-facing errors for critical issues
      if (event.reason instanceof Error && !event.reason.message.includes('Load failed')) {
        toast.error('A network or data error occurred');
      }
    };

    // Console error override for development
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      console.error = (...args) => {
        // Call original console.error
        originalError.apply(console, args);
        
        // Filter out non-critical errors
        const message = args.join(' ');
        if (message.includes('fetchPriority') || 
            message.includes('ResizeObserver') || 
            message.includes('Warning: React does not recognize')) {
          // These are non-critical, don't show to user
          return;
        }
      };
    }

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}