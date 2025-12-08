import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { logger } from '@/utils/logger';

interface ErrorReport {
  id?: string;
  error_message: string;
  error_stack?: string;
  user_id?: string;
  session_id?: string;
  url: string;
  user_agent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  additional_context?: any;
}

interface ErrorTrackerContextType {
  logError: (error: Error, context?: Record<string, any>, severity?: ErrorReport['severity']) => void;
  logEvent: (event: string, data?: Record<string, any>) => void;
}

const ErrorTrackerContext = createContext<ErrorTrackerContextType | undefined>(undefined);

interface ErrorTrackerProviderProps {
  children: React.ReactNode;
}

export const ErrorTrackerProvider: React.FC<ErrorTrackerProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('error_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('error_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const logError = useCallback(async (
    error: Error, 
    context?: Record<string, any>, 
    severity: ErrorReport['severity'] = 'medium'
  ) => {
    try {
      const errorReport = {
        error_message: error.message,
        error_stack: error.stack,
        user_id: user?.id,
        session_id: getSessionId(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity,
        component: context?.component || 'unknown',
        additional_context: {
          ...context,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          platform: navigator.platform,
        }
      };

      await supabase.rpc('log_audit_event', {
        p_action: 'ERROR_REPORT',
        p_table_name: 'application_errors',
        p_record_id: crypto.randomUUID(),
        p_old_values: null,
        p_new_values: errorReport
      });

      logger.error('Error logged:', errorReport);
    } catch (logError) {
      logger.error('Failed to log error:', logError);
      const failedLogs = JSON.parse(localStorage.getItem('failed_error_logs') || '[]');
      failedLogs.push({ error: error.message, timestamp: new Date().toISOString(), context });
      localStorage.setItem('failed_error_logs', JSON.stringify(failedLogs.slice(-10)));
    }
  }, [user?.id, getSessionId]);

  const logEvent = useCallback(async (event: string, data?: Record<string, any>) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: 'EVENT_TRACKED',
        p_table_name: 'event_tracking',
        p_record_id: crypto.randomUUID(),
        p_new_values: {
          event_name: `event_${event}`,
          event_data: data,
          user_id: user?.id,
          session_id: getSessionId(),
          url: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to log event:', error);
    }
  }, [user?.id, getSessionId]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(new Error(event.error?.message || event.message), {
        component: 'global_error_handler',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'high');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(new Error(`Unhandled promise rejection: ${event.reason}`), {
        component: 'promise_rejection_handler',
        reason: event.reason
      }, 'high');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [logError]);

  const value: ErrorTrackerContextType = { logError, logEvent };

  return (
    <ErrorTrackerContext.Provider value={value}>
      {children}
    </ErrorTrackerContext.Provider>
  );
};

export const useErrorTracker = (): ErrorTrackerContextType => {
  const context = useContext(ErrorTrackerContext);
  if (!context) {
    throw new Error('useErrorTracker must be used within an ErrorTrackerProvider');
  }
  return context;
};

export class ProductionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error boundary caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">We've been notified and are working on a fix.</p>
            <button onClick={this.resetError} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}