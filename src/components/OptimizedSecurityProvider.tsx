import React, { createContext, useContext, useEffect, useState } from 'react';
import { optimizedSecurity } from '@/utils/optimizedSecurity';
import { toast } from 'sonner';

interface SecurityContextType {
  isSecurityChecked: boolean;
  checkSecurity: (endpoint: string) => Promise<boolean>;
  sanitizeInput: (input: string) => string;
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useOptimizedSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useOptimizedSecurity must be used within OptimizedSecurityProvider');
  }
  return context;
};

interface OptimizedSecurityProviderProps {
  children: React.ReactNode;
  enableRateLimit?: boolean;
}

export const OptimizedSecurityProvider: React.FC<OptimizedSecurityProviderProps> = ({ 
  children, 
  enableRateLimit = true 
}) => {
  const [isSecurityChecked, setIsSecurityChecked] = useState(false);

  const checkSecurity = async (endpoint: string): Promise<boolean> => {
    try {
      if (!enableRateLimit) {
        return true;
      }

      // Enhanced security checks for different endpoint types
      const criticalEndpoints = ['/admin', '/api/admin', '/payments'];
      const sensitiveEndpoints = ['/auth', '/api', '/upload', '/vendor'];
      const publicEndpoints = ['/properties', '/contact', '/'];
      
      let maxRequests = 100;
      let windowMs = 60000;
      
      // Adjust rate limits based on endpoint sensitivity
      if (criticalEndpoints.some(path => endpoint.includes(path))) {
        maxRequests = 5;
        windowMs = 300000; // 5 minutes for critical endpoints
      } else if (sensitiveEndpoints.some(path => endpoint.includes(path))) {
        maxRequests = 20;
        windowMs = 60000; // 1 minute for sensitive endpoints
      } else if (publicEndpoints.some(path => endpoint.includes(path))) {
        maxRequests = 100;
        windowMs = 60000; // More lenient for public endpoints
      }

      const isAllowed = optimizedSecurity.checkClientRateLimit(endpoint, maxRequests, windowMs);
      
      if (!isAllowed) {
        // Log security event for rate limit exceeded
        await optimizedSecurity.logSecurityEvent('CLIENT_RATE_LIMIT_EXCEEDED', {
          endpoint,
          maxRequests,
          windowMs,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
        
        toast.error('Too many requests. Please wait before trying again.');
        return false;
      }

      return true;
    } catch (error) {
      // Only log in development
      if (import.meta.env.DEV) {
        console.warn('Security check failed:', error);
      }
      
      // Log security check failure to server
      optimizedSecurity.logSecurityEvent('SECURITY_CHECK_FAILED', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      }).catch(() => {});
      
      return true; // Fail open for better UX
    }
  };

  useEffect(() => {
    // Mark security as checked after initial load
    const timer = setTimeout(() => {
      setIsSecurityChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const contextValue: SecurityContextType = {
    isSecurityChecked,
    checkSecurity,
    sanitizeInput: optimizedSecurity.sanitizeInput.bind(optimizedSecurity),
    validateEmail: optimizedSecurity.validateEmail.bind(optimizedSecurity),
    validatePassword: optimizedSecurity.validatePassword.bind(optimizedSecurity),
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};