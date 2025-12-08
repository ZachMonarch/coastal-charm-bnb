/**
 * Data masking utilities for production security
 */

export interface PropertyData {
  id: number;
  title: string;
  description: string;
  address: string;
  price: number;
  owner_id?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Mask sensitive property data for public viewing
 */
export function maskPropertyData(property: PropertyData, isAuthenticated: boolean = false, userRole?: string): PropertyData {
  const maskedProperty = { ...property };

  // Always mask these fields for security
  if (maskedProperty.owner_id) {
    delete maskedProperty.owner_id;
  }

  // Mask contact info unless authenticated with appropriate role
  if (!isAuthenticated || userRole !== 'admin') {
    if (maskedProperty.phone) {
      maskedProperty.phone = maskPhoneNumber(maskedProperty.phone);
    }
    
    if (maskedProperty.email) {
      maskedProperty.email = maskEmail(maskedProperty.email);
    }
  }

  // Mask exact address for privacy (show general area only)
  if (!isAuthenticated) {
    maskedProperty.address = maskAddress(maskedProperty.address);
  }

  // Remove any other sensitive fields
  const sensitiveFields = ['internal_notes', 'cost_basis', 'profit_margin', 'owner_contact'];
  sensitiveFields.forEach(field => {
    if (maskedProperty[field]) {
      delete maskedProperty[field];
    }
  });

  return maskedProperty;
}

/**
 * Mask phone number - show only last 4 digits
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return '***-***-****';
  
  const lastFour = phone.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * Mask email address - show only domain
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****@****.com';
  
  const [, domain] = email.split('@');
  return `****@${domain}`;
}

/**
 * Mask address - show only city and state
 */
export function maskAddress(address: string): string {
  if (!address) return 'Address available upon inquiry';
  
  // Try to extract city, state from address
  const parts = address.split(',');
  if (parts.length >= 2) {
    const city = parts[parts.length - 2]?.trim();
    const state = parts[parts.length - 1]?.trim();
    return `${city}, ${state}`;
  }
  
  // Fallback: show "General Area"
  return 'General Area - Full address available upon inquiry';
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize form data
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as any;
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  });
  
  return sanitized;
}