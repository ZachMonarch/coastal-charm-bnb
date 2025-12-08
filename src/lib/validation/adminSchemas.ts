import { z } from 'zod';

/**
 * Validation schemas for admin operations
 * Ensures data integrity and prevents malformed inputs
 */

// Payment validation
export const paymentSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  amount: z.number()
    .min(0.01, 'Minimum payment is $0.01')
    .max(1000000, 'Maximum payment is $1,000,000'),
  payment_date: z.date().or(z.string()),
  payment_method: z.enum(['check', 'ach', 'wire', 'credit_card', 'cash'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }).optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid payment status' })
  }).default('pending'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
});

// Property validation
export const propertySchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(300, 'Address must be less than 300 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be less than 50 characters'),
  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  property_type: z.enum(['residential', 'commercial', 'industrial', 'land', 'mixed_use'], {
    errorMap: () => ({ message: 'Invalid property type' })
  }),
  bedrooms: z.number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Minimum 0 bedrooms')
    .max(50, 'Maximum 50 bedrooms')
    .optional(),
  bathrooms: z.number()
    .int('Bathrooms must be a whole number')
    .min(0, 'Minimum 0 bathrooms')
    .max(50, 'Maximum 50 bathrooms')
    .optional(),
  square_feet: z.string()
    .regex(/^\d+$/, 'Square feet must be a number')
    .refine((val) => parseInt(val) >= 100 && parseInt(val) <= 1000000, {
      message: 'Square feet must be between 100 and 1,000,000'
    })
    .optional(),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(100000000, 'Maximum price is $100,000,000')
    .optional(),
  status: z.enum(['available', 'rented', 'maintenance', 'sold', 'pending'], {
    errorMap: () => ({ message: 'Invalid property status' })
  }).default('available'),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
});

// RFQ/Project validation
export const projectSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  category: z.string()
    .min(2, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  budget_min: z.number()
    .min(0, 'Budget cannot be negative')
    .max(10000000, 'Maximum budget is $10,000,000')
    .optional(),
  budget_max: z.number()
    .min(0, 'Budget cannot be negative')
    .max(10000000, 'Maximum budget is $10,000,000')
    .optional(),
  deadline: z.date()
    .min(new Date(), 'Deadline must be in the future')
    .or(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Invalid priority level' })
  }).default('medium'),
  status: z.enum(['draft', 'open', 'in_progress', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid project status' })
  }).default('draft'),
  skills_required: z.array(z.string()).optional(),
  location: z.string().max(300, 'Location must be less than 300 characters').optional()
}).refine((data) => {
  if (data.budget_min && data.budget_max) {
    return data.budget_max >= data.budget_min;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budget_max']
});

// User role assignment validation
export const userRoleSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['admin', 'property_manager', 'vendor', 'tenant'], {
    errorMap: () => ({ message: 'Invalid role' })
  })
});

// Invoice validation
export const invoiceSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID').optional(),
  project_id: z.string().uuid('Invalid project ID').optional(),
  invoice_number: z.string()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number must be less than 50 characters'),
  client_name: z.string()
    .min(2, 'Client name must be at least 2 characters')
    .max(200, 'Client name must be less than 200 characters'),
  client_email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  amount: z.number()
    .min(0.01, 'Minimum invoice amount is $0.01')
    .max(10000000, 'Maximum invoice amount is $10,000,000'),
  due_date: z.date().or(z.string()).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid invoice status' })
  }).default('draft'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  line_items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().int().min(1).max(10000),
    unit_price: z.number().min(0.01).max(1000000),
    total: z.number().min(0.01).max(10000000)
  })).optional()
});

// File upload validation
export const fileUploadSchema = z.object({
  file_name: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),
  file_size: z.number()
    .min(1, 'File cannot be empty')
    .max(10485760, 'Maximum file size is 10MB'), // 10MB in bytes
  mime_type: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
  file_path: z.string().min(1, 'File path is required')
});

// Contract validation
export const contractSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  vendor_id: z.string().uuid('Invalid vendor ID'),
  project_id: z.string().uuid('Invalid project ID').optional(),
  contract_value: z.number()
    .min(0.01, 'Minimum contract value is $0.01')
    .max(100000000, 'Maximum contract value is $100,000,000'),
  start_date: z.date().or(z.string()),
  end_date: z.date().or(z.string()),
  status: z.enum(['draft', 'active', 'completed', 'cancelled', 'expired'], {
    errorMap: () => ({ message: 'Invalid contract status' })
  }).default('draft'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  terms: z.record(z.any()).optional()
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date']
});

// Export validation helpers
export const validatePayment = (data: unknown) => paymentSchema.parse(data);
export const validateProperty = (data: unknown) => propertySchema.parse(data);
export const validateProject = (data: unknown) => projectSchema.parse(data);
export const validateUserRole = (data: unknown) => userRoleSchema.parse(data);
export const validateInvoice = (data: unknown) => invoiceSchema.parse(data);
export const validateFileUpload = (data: unknown) => fileUploadSchema.parse(data);
export const validateContract = (data: unknown) => contractSchema.parse(data);
