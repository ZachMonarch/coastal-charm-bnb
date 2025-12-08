/**
 * Production-Safe Logger Utility
 * Prevents console pollution in production while maintaining error visibility
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LoggerConfig {
  enableInProduction: boolean;
  minLevel: LogLevel;
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
   */
  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Error-level logging (always enabled)
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
    
    // In production, you could send to error tracking service
    if (!import.meta.env.DEV) {
      // TODO: Send to Sentry/LogRocket/etc
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
};

// Export for use in error boundaries and monitoring
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
