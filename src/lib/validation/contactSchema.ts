import { z } from 'zod';

/**
 * Validation schema for contact form
 * Prevents XSS, injection attacks, and ensures data integrity
 */
export const contactSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  
  lastName: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\+\(\)]{10,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  subject: z.string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters'),
  
  category: z.string()
    .min(1, 'Please select a category'),
  
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const validateContact = (data: unknown) => contactSchema.parse(data);
