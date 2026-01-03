/**
 * Shared validation schemas for Edge Functions
 * Server-side enforcement to prevent injection attacks and malformed data
 * 
 * SECURITY: These schemas MUST match or be stricter than client-side validation
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================
// Common Validation Helpers
// ============================================

/** Sanitize string input - removes potential XSS/injection characters */
const sanitizedString = (maxLength: number) => z.string()
  .max(maxLength)
  .transform(val => val.trim())
  .refine(val => !/<script|javascript:|on\w+=/i.test(val), {
    message: 'Invalid characters detected'
  });

/** UUID validation with proper format check */
const uuidString = z.string().uuid('Invalid UUID format');

/** Positive amount with reasonable limits */
const positiveAmount = z.number()
  .positive('Amount must be positive')
  .max(10000000, 'Amount exceeds maximum limit'); // $10M limit

// ============================================
// Payment Schemas
// ============================================

export const CreatePaymentSchema = z.object({
  payment_id: uuidString.optional(),
  paymentId: uuidString.optional(), // Legacy support
}).refine(
  data => data.payment_id || data.paymentId,
  { message: 'Payment ID is required' }
);

export const ProcessRefundSchema = z.object({
  refundId: uuidString,
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be approve or reject' })
  }),
  adminNotes: sanitizedString(1000).optional()
});

export const ProcessWithdrawalSchema = z.object({
  payoutId: uuidString,
  action: z.enum(['approve', 'complete', 'reject'], {
    errorMap: () => ({ message: 'Invalid action' })
  }),
  transactionId: sanitizedString(100).optional(),
  notes: sanitizedString(1000).optional()
}).refine(
  data => !(data.action === 'complete' && !data.transactionId),
  { message: 'Transaction ID is required for completion', path: ['transactionId'] }
);

// ============================================
// Admin Schemas
// ============================================

export const AdminPaymentSchema = z.object({
  vendor_id: uuidString,
  amount: positiveAmount,
  title: sanitizedString(200),
  description: sanitizedString(2000).optional(),
  payment_type: z.enum(['background_check', 'service_fee', 'security_bond', 'osha_certification', 'custom']),
  due_date: z.string().datetime().optional().or(z.null())
});

export const UserRoleSchema = z.object({
  user_id: uuidString,
  role: z.enum(['admin', 'property_manager', 'vendor', 'tenant'], {
    errorMap: () => ({ message: 'Invalid role' })
  })
});

// ============================================
// Project/RFQ Schemas
// ============================================

export const ProjectSchema = z.object({
  title: sanitizedString(200).pipe(z.string().min(5, 'Title must be at least 5 characters')),
  description: sanitizedString(5000).optional(),
  category: sanitizedString(100),
  budget_min: z.number().min(0).max(10000000).optional(),
  budget_max: z.number().min(0).max(10000000).optional(),
  deadline: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled']).default('draft')
}).refine(
  data => {
    if (data.budget_min && data.budget_max) {
      return data.budget_max >= data.budget_min;
    }
    return true;
  },
  { message: 'Maximum budget must be >= minimum budget', path: ['budget_max'] }
);

// ============================================
// Contact/Message Schemas
// ============================================

export const ContactSchema = z.object({
  firstName: sanitizedString(50).pipe(z.string().min(1, 'First name required')),
  lastName: sanitizedString(50).pipe(z.string().min(1, 'Last name required')),
  email: z.string().email('Invalid email').max(255).transform(val => val.toLowerCase()),
  phone: z.string().regex(/^[\d\s\-\+\(\)]{10,20}$/, 'Invalid phone format').optional().or(z.literal('')),
  subject: sanitizedString(200).pipe(z.string().min(3, 'Subject too short')),
  category: z.string().min(1, 'Category required'),
  message: sanitizedString(2000).pipe(z.string().min(10, 'Message too short'))
});

// ============================================
// File Upload Schema
// ============================================

export const FileUploadSchema = z.object({
  file_name: sanitizedString(255).pipe(z.string().min(1, 'File name required')),
  file_size: z.number().min(1, 'File cannot be empty').max(10485760, 'Max file size is 10MB'),
  mime_type: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
  file_path: z.string().min(1, 'File path required')
});

// ============================================
// Validation Response Helpers
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export function formatValidationErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(e => ({
    field: e.path.join('.'),
    message: e.message
  }));
}

export function createValidationErrorResponse(
  error: z.ZodError,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formatValidationErrors(error)
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// ============================================
// Rate Limiting Helper
// ============================================

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  payment: { windowMs: 60000, maxRequests: 10 },  // 10 per minute
  refund: { windowMs: 60000, maxRequests: 5 },    // 5 per minute
  withdrawal: { windowMs: 60000, maxRequests: 5 }, // 5 per minute
  admin: { windowMs: 60000, maxRequests: 30 },    // 30 per minute
  default: { windowMs: 60000, maxRequests: 60 }   // 60 per minute
};
