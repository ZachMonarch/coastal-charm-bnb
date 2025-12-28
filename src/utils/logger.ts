/**
 * Production-Safe Logger Utility
 * Integrates with Sentry for production error tracking
 * Prevents console pollution in production while maintaining error visibility
 */

import * as Sentry from '@sentry/react';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LoggerConfig {
  enableInProduction: boolean;
  minLevel: LogLevel;
}

interface ErrorContext {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

const config: LoggerConfig = {
  enableInProduction: false,
  minLevel: import.meta.env.DEV ? 'debug' : 'error',
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  log: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const shouldLog = (level: LogLevel): boolean => {
  if (import.meta.env.DEV) return true;
  if (config.enableInProduction && levelPriority[level] >= levelPriority[config.minLevel]) {
    return true;
  }
  return level === 'error'; // Always log errors
};

/**
 * Send error to Sentry in production
 */
const sendToSentry = (error: Error | string, context?: Record<string, any>, level: Sentry.SeverityLevel = 'error') => {
  if (import.meta.env.DEV) return;
  
  try {
    if (context) {
      Sentry.setContext('error_context', context);
    }
    
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level,
        extra: context,
      });
    } else {
      Sentry.captureMessage(error, {
        level,
        extra: context,
      });
    }
  } catch (sentryError) {
    // Fallback if Sentry fails - don't break the app
    console.error('[Logger] Failed to send to Sentry:', sentryError);
  }
};

/**
 * Create structured error context for logging
 */
const createErrorContext = (message: string, error?: Error, additionalContext?: Record<string, any>): ErrorContext => ({
  message,
  stack: error?.stack,
  context: additionalContext,
  timestamp: new Date().toISOString(),
  url: typeof window !== 'undefined' ? window.location.href : undefined,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
});

export const logger = {
  /**
   * Debug-level logging (development only)
   */
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Info-level logging (development only)
   */
  log: (message: string, ...args: any[]) => {
    if (shouldLog('log')) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },

  /**
   * Info-level logging (development only)
   */
  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Warning-level logging (production enabled if configured)
   * Sends to Sentry as warning level
   */
  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
    
    // Send warnings to Sentry in production
    if (!import.meta.env.DEV) {
      const context = args.length > 0 ? { details: args } : undefined;
      sendToSentry(message, context, 'warning');
    }
  },

  /**
   * Error-level logging (always enabled)
   * Always sends to Sentry in production
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
    
    // Always send errors to Sentry in production
    if (!import.meta.env.DEV) {
      const errorArg = args.find(arg => arg instanceof Error);
      const context = args.length > 0 
        ? { details: args.filter(arg => !(arg instanceof Error)) } 
        : undefined;
      
      if (errorArg) {
        sendToSentry(errorArg, { message, ...context });
      } else {
        sendToSentry(message, context);
      }
    }
  },

  /**
   * Group logging for better organization
   */
  group: (label: string, callback: () => void) => {
    if (import.meta.env.DEV) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Performance timing
   */
  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label);
    }
  },

  /**
   * Add breadcrumb for Sentry tracking
   */
  breadcrumb: (message: string, category: string = 'app', data?: Record<string, any>) => {
    if (!import.meta.env.DEV) {
      Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data,
      });
    }
  },

  /**
   * Set user context for Sentry
   */
  setUser: (user: { id: string; email?: string; role?: string } | null) => {
    if (!import.meta.env.DEV) {
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          role: user.role,
        });
      } else {
        Sentry.setUser(null);
      }
    }
  },
};

/**
 * Export for use in error boundaries and monitoring
 * Sends structured error to Sentry with full context
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  const errorContext = createErrorContext(error.message, error, context);
  
  logger.error('Application Error:', errorContext);
  
  // Additional Sentry capture with full stack trace
  if (!import.meta.env.DEV) {
    Sentry.captureException(error, {
      extra: { ...errorContext } as Record<string, unknown>,
      tags: {
        error_type: error.name,
        has_context: context ? 'true' : 'false',
      },
    });
  }
};

/**
 * Capture unhandled promise rejections
 */
export const setupGlobalErrorHandlers = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise Rejection:', event.reason);
    });
    
    window.addEventListener('error', (event) => {
      logger.error('Uncaught Error:', event.error || event.message);
    });
  }
};

export default logger;
