// Lightweight security utilities without external dependencies

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Lightweight version without DOMPurify dependency
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  
  // Remove dangerous tags and scripts
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags for safety
    .trim();
};

/**
 * Sanitizes plain text input
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 10000); // Limit length
};

/**
 * Validates and sanitizes file names
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') return 'file';
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .substring(0, 255); // Limit length
};

/**
 * Validates file type against allowed extensions
 */
export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.toLowerCase().split('.').pop();
  return extension ? allowedTypes.includes(extension) : false;
};

/**
 * Validates file size
 */
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size > 0 && size <= maxSize;
};

/**
 * Comprehensive input validation
 */
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(phone);
  },
  
  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },
  
  alphanumeric: (text: string): boolean => {
    return /^[a-zA-Z0-9\s\-_.,!?]+$/.test(text);
  },
  
  strongPassword: (password: string): boolean => {
    // At least 8 chars, 1 upper, 1 lower, 1 number, 1 special
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }
};

/**
 * Rate limiting for sensitive operations
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute