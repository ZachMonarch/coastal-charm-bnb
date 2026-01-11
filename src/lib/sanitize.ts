/**
 * Centralized DOMPurify configuration for secure HTML sanitization
 * Used for email content, user-generated HTML, and other untrusted content
 */
import DOMPurify from 'dompurify';

/**
 * Restrictive DOMPurify configuration for email HTML content
 * - Allows common email formatting tags
 * - Explicitly forbids dangerous elements and attributes
 * - Prevents XSS attacks while maintaining email readability
 */
export const EMAIL_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'div',
    'small', 'sub', 'sup', 'blockquote', 'pre', 'code', 'center', 'font',
    // Links and images
    'a', 'img',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Lists
    'ul', 'ol', 'li'
  ],
  ALLOWED_ATTR: [
    // Link attributes
    'href', 'target', 'rel',
    // Image attributes
    'src', 'alt', 'title', 'width', 'height',
    // Styling (limited)
    'style', 'class', 'id', 'align', 'valign',
    // Table attributes
    'bgcolor', 'color', 'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan'
  ],
  // Security settings
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option', 'meta', 'link', 'base', 'noscript'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onmouseout', 'onmouseenter', 'onmouseleave', 'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit', 'onreset', 'onchange', 'oninput'],
  // Additional security
  ADD_ATTR: ['target'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  IN_PLACE: false
};

/**
 * Sanitize HTML content for safe rendering
 * @param html - The HTML string to sanitize
 * @param config - Optional custom DOMPurify config (defaults to EMAIL_DOMPURIFY_CONFIG)
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string, config = EMAIL_DOMPURIFY_CONFIG): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Trim and validate input length
  const trimmedHtml = html.trim();
  if (trimmedHtml.length === 0) {
    return '';
  }
  
  // Maximum allowed content length (1MB)
  const MAX_HTML_LENGTH = 1024 * 1024;
  if (trimmedHtml.length > MAX_HTML_LENGTH) {
    console.warn('[sanitizeHtml] Content exceeds maximum allowed length, truncating');
    return DOMPurify.sanitize(trimmedHtml.slice(0, MAX_HTML_LENGTH), config) as string;
  }
  
  return DOMPurify.sanitize(trimmedHtml, config) as string;
}

/**
 * Check if HTML content contains potentially dangerous patterns
 * Use this for pre-validation before storing content
 * @param html - The HTML string to check
 * @returns Object with validation result and detected issues
 */
export function validateHtmlSecurity(html: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!html || typeof html !== 'string') {
    return { isValid: true, issues: [] };
  }
  
  // Check for script tags (even encoded)
  if (/<script/i.test(html) || /&#60;script/i.test(html) || /%3Cscript/i.test(html)) {
    issues.push('Contains script tags');
  }
  
  // Check for event handlers
  if (/\bon\w+\s*=/i.test(html)) {
    issues.push('Contains event handler attributes');
  }
  
  // Check for javascript: protocol
  if (/javascript:/i.test(html)) {
    issues.push('Contains javascript: protocol');
  }
  
  // Check for data: protocol (can be used for XSS)
  if (/data:\s*text\/html/i.test(html)) {
    issues.push('Contains data:text/html protocol');
  }
  
  // Check for vbscript: protocol
  if (/vbscript:/i.test(html)) {
    issues.push('Contains vbscript: protocol');
  }
  
  // Check for iframe/object/embed
  if (/<(iframe|object|embed|form)/i.test(html)) {
    issues.push('Contains forbidden embed elements');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
