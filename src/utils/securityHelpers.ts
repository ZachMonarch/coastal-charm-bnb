// Security utility functions for data sanitization and validation
export const securityHelpers = {
  // Sanitize HTML content to prevent XSS
  sanitizeHtml: (html: string): string => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  // Validate and sanitize user input
  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number format
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  },

  // Remove sensitive data from objects before logging
  sanitizeForLogging: (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = { ...obj };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn'];
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  },

  // Rate limiting helper
  createRateLimiter: (maxRequests: number, windowMs: number) => {
    const requests = new Map();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter((time: number) => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limited
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      // Clean up old entries periodically
      if (requests.size > 1000) {
        const cutoff = now - windowMs;
        for (const [id, times] of requests.entries()) {
          if (times.every((time: number) => time < cutoff)) {
            requests.delete(id);
          }
        }
      }
      
      return true; // Allowed
    };
  },

  // Secure token generation
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};