// Secure error handling - prevents information leakage
import { optimizedSecurity } from './optimizedSecurity';

interface ErrorContext {
  endpoint?: string;
  userId?: string;
  action?: string;
  table?: string;
}

export class SecureErrorHandler {
  private static instance: SecureErrorHandler;

  static getInstance(): SecureErrorHandler {
    if (!SecureErrorHandler.instance) {
      SecureErrorHandler.instance = new SecureErrorHandler();
    }
    return SecureErrorHandler.instance;
  }

  // Generic error message for permission denied
  handlePermissionDenied(error: any, context: ErrorContext = {}): Error {
    // Log full error details server-side for security team
    this.logSecurityError('PERMISSION_DENIED', {
      originalError: error.message,
      table: this.extractTableName(error.message),
      endpoint: context.endpoint,
      userId: context.userId,
      action: context.action,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Return generic message to client
    return new Error('Access denied. You do not have permission to perform this action.');
  }

  // Generic error message for authentication failures
  handleAuthError(error: any, context: ErrorContext = {}): Error {
    this.logSecurityError('AUTH_ERROR', {
      originalError: error.message,
      endpoint: context.endpoint,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    });

    // Generic message - don't reveal if email exists, password wrong, etc.
    return new Error('Authentication failed. Please check your credentials and try again.');
  }

  // Generic error message for rate limit exceeded
  handleRateLimitError(context: ErrorContext = {}): Error {
    this.logSecurityError('RATE_LIMIT_EXCEEDED', {
      endpoint: context.endpoint,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    });

    return new Error('Too many requests. Please wait a moment and try again.');
  }

  // Generic error message for validation failures
  handleValidationError(error: any, context: ErrorContext = {}): Error {
    this.logSecurityError('VALIDATION_ERROR', {
      originalError: error.message,
      endpoint: context.endpoint,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    });

    return new Error('Invalid input. Please check your data and try again.');
  }

  // Main error handler - determines error type and returns appropriate message
  handleError(error: any, context: ErrorContext = {}): Error {
    const errorMessage = error.message || error.toString();

    // Permission denied errors
    if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
      return this.handlePermissionDenied(error, context);
    }

    // Authentication errors
    if (errorMessage.includes('Invalid login') || 
        errorMessage.includes('Email not confirmed') ||
        errorMessage.includes('JWT')) {
      return this.handleAuthError(error, context);
    }

    // Rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return this.handleRateLimitError(context);
    }

    // Validation errors
    if (errorMessage.includes('violates') || 
        errorMessage.includes('constraint') ||
        errorMessage.includes('invalid')) {
      return this.handleValidationError(error, context);
    }

    // For unknown errors, log and return generic message
    this.logSecurityError('UNKNOWN_ERROR', {
      originalError: errorMessage,
      ...context,
      timestamp: new Date().toISOString(),
    });

    return new Error('An error occurred. Please try again later.');
  }

  // Extract table name from error message (for logging only)
  private extractTableName(errorMessage: string): string | null {
    const tableMatch = errorMessage.match(/table "?(\w+)"?/i);
    return tableMatch ? tableMatch[1] : null;
  }

  // Log security errors
  private async logSecurityError(eventType: string, details: Record<string, any>): Promise<void> {
    try {
      await optimizedSecurity.logSecurityEvent(eventType, details);
    } catch (error) {
      // Silent fail - don't expose logging errors to client
      console.warn('Failed to log security error:', error);
    }
  }

  // Alert on suspicious patterns (multiple permission denied from same user)
  async checkSuspiciousActivity(userId: string, eventType: string): Promise<boolean> {
    // This would query security_events table to check for patterns
    // For now, just a placeholder
    return false;
  }
}

// Export singleton
export const secureErrorHandler = SecureErrorHandler.getInstance();

// Convenience function for wrapping async operations
export async function secureAsyncWrapper<T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw secureErrorHandler.handleError(error, context);
  }
}
