import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Sentry from '@sentry/react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Use logger for production-safe error logging
    logger.error('Global error boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to Sentry in production
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to production monitoring service
    if (import.meta.env.PROD) {
      import('@/utils/productionMonitoring').then(({ logProductionError }) => {
        logProductionError(error.message, error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'GlobalErrorBoundary'
        });
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    // Since this is a class component, we can't use useNavigate
    // Using window.location.href is acceptable here for error boundaries
    // as they are fallback mechanisms when React routing may have failed
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default comprehensive error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/10 to-background">
          <Card className="w-full max-w-lg mx-auto neumorphic-card">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  We encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold mb-2">What you can do:</h4>
                  <ul className="text-sm text-left space-y-1">
                    <li>• Try refreshing the page</li>
                    <li>• Go back to the homepage</li>
                    <li>• Clear your browser cache</li>
                    <li>• Contact support if the issue persists</li>
                  </ul>
                </div>
              </div>

              {!import.meta.env.PROD && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium mb-3 text-destructive">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="bg-muted p-4 rounded-lg text-xs font-mono overflow-auto max-h-48">
                    <div className="text-destructive font-semibold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="font-semibold mb-2">Component Stack:</div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 btn-primary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Error ID: {Date.now().toString(36)} • 
                  Time: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export const useAsyncErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Async error caught:', error, errorInfo);
    
    // Log to production monitoring service
    if (import.meta.env.PROD) {
      import('@/utils/productionMonitoring').then(({ logProductionError }) => {
        logProductionError(error.message, error, errorInfo);
      });
    }
  };
};

// Higher-order component for wrapping components with error boundary
export const withGlobalErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withGlobalErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};