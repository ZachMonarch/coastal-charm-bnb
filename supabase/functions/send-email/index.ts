import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Phase 4.4: Validate RESEND_API_KEY exists at startup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  console.error("CRITICAL: RESEND_API_KEY environment variable not set");
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - html and subject are optional when using templates
const EmailRequestSchema = z.object({
  to: z.string().email().max(254),
  subject: z.string().min(1).max(998).optional(),
  html: z.string().min(1).max(100000).optional(),
  template: z.enum([
    'vendor-invite', 'vendor_invite', 
    'maintenance_notification', 
    'payment-notification', 'payment_reminder', 
    'booking_confirmation',
    'test', 'welcome', 'project_assignment', 'password_reset'
  ]).optional(),
  data: z.record(z.any()).optional(),
  emailType: z.enum(['notification', 'welcome', 'reset', 'verification', 'maintenance', 'payment', 'booking', 'test']).optional()
}).refine(data => data.html || data.template, {
  message: "Either 'html' or 'template' must be provided"
});

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  template?: string;
  data?: Record<string, any>;
  emailType?: 'notification' | 'welcome' | 'reset' | 'verification' | 'maintenance' | 'payment' | 'booking';
}

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function sanitizeContent(content: string): string {
  // Basic HTML sanitization - remove script tags and suspicious content
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function checkRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Phase 4.4: Validate RESEND_API_KEY before processing
    if (!resend || !RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured - email service unavailable');
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured', 
          code: 'MISSING_API_KEY' 
        }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Rate limiting per user
    const clientIP = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';
    const rateLimitKey = `${user.id}_${clientIP}`;
    
    if (!checkRateLimit(rateLimitKey, 5, 60000)) { // 5 emails per minute per user
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending more emails.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const requestBody = await req.json();
    
    // Validate input using zod schema
    const validationResult = EmailRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { to, subject, html, template, data, emailType } = validationResult.data;

    // Check user's email notification preferences
    const { data: recipientProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', to)
      .single();

    if (recipientProfile) {
      const { data: settings } = await supabaseClient
        .from('user_notification_settings')
        .select('email_notifications, payment_alerts, invoice_alerts, project_updates, security_alerts')
        .eq('user_id', recipientProfile.id)
        .single();

      // If settings exist and email notifications are disabled, skip
      if (settings && !settings.email_notifications) {
        console.log(`Email notifications disabled for ${to}, skipping...`);
        return new Response(
          JSON.stringify({ message: 'Email skipped - user preferences' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Check specific email type preferences
      if (settings) {
        const shouldSkip = 
          (emailType === 'payment' && !settings.payment_alerts) ||
          ((template === 'payment-notification' || template === 'payment_reminder') && !settings.payment_alerts) ||
          (emailType === 'notification' && html?.toLowerCase().includes('invoice') && !settings.invoice_alerts) ||
          (emailType === 'notification' && html?.toLowerCase().includes('project') && !settings.project_updates);
        
        if (shouldSkip) {
          console.log(`Email type ${emailType} disabled for ${to}, skipping...`);
          return new Response(
            JSON.stringify({ message: 'Email skipped - user preferences' }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    }

    console.log("Sending email to:", to);

    let emailHtml = html || '';
    let emailSubject = subject || 'Notification from Monarch Property Management';

    // Handle different email templates
    if (template) {
      switch (template) {
        case 'vendor-invite':
        case 'vendor_invite':
          emailHtml = generateVendorInviteEmail(data);
          emailSubject = subject || 'Invitation to Join Monarch Property Management';
          break;
        case 'maintenance_notification':
          emailHtml = generateMaintenanceNotificationEmail(data);
          emailSubject = subject || 'New Maintenance Request';
          break;
        case 'payment-notification':
        case 'payment_reminder':
          emailHtml = generatePaymentReminderEmail(data);
          emailSubject = subject || 'Payment Reminder';
          break;
        case 'booking_confirmation':
          emailHtml = generateBookingConfirmationEmail(data);
          emailSubject = subject || 'Booking Confirmation';
          break;
        case 'test':
          emailHtml = generateTestEmail(data);
          emailSubject = subject || 'Test Email from Monarch Property Management';
          break;
        case 'welcome':
          emailHtml = generateWelcomeEmail(data);
          emailSubject = subject || 'Welcome to Monarch Property Management';
          break;
        case 'project_assignment':
          emailHtml = generateProjectAssignmentEmail(data);
          emailSubject = subject || 'New Project Assignment';
          break;
        case 'password_reset':
          emailHtml = generatePasswordResetEmail(data);
          emailSubject = subject || 'Password Reset Request';
          break;
        default:
          emailHtml = html ? sanitizeContent(html) : '';
      }
    } else if (html) {
      emailHtml = sanitizeContent(html);
    }

    // Sanitize subject
    const sanitizedSubject = emailSubject.replace(/[\r\n]/g, '');

    // Log security event
    const logResult = await supabaseClient.rpc('log_security_audit', {
      p_event_type: 'EMAIL_SENT',
      p_severity: 'low',
      p_details: {
        to: to,
        subject: sanitizedSubject,
        emailType: emailType || template || 'general',
        userAgent: req.headers.get('User-Agent'),
        ip: clientIP
      }
    });
    
    if (logResult.error) {
      console.warn('Failed to log security event:', logResult.error);
    }

    const emailResponse = await resend.emails.send({
      from: "Monarch Property Management <noreply@monarchpropertymmgt.com>",
      to: [to],
      subject: sanitizedSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-email function:", error);
    
    // Log error event server-side only
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient.rpc('log_security_audit', {
        p_event_type: 'EMAIL_ERROR',
        p_severity: 'medium',
        p_details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.warn('Failed to log error event:', logError);
    }
    
    // Return generic error to client (security: don't leak details)
    return new Response(
      JSON.stringify({ 
        error: 'Unable to send email',
        code: 'EMAIL_SEND_FAILED'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateVendorInviteEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 Vendor Invitation</h1>
                <p>Join Monarch Property Management Network</p>
            </div>
            <div class="content">
                <h2>Hello ${data?.companyName || 'Vendor'},</h2>
                <p>You've been invited to join our exclusive vendor network at Monarch Property Management.</p>
                
                <p><strong>Invitation Details:</strong></p>
                <ul>
                    <li>Company: ${data?.companyName || 'Your Company'}</li>
                    <li>Specialties: ${data?.specialties?.join(', ') || 'Various Services'}</li>
                    <li>Invited by: ${data?.adminEmail || 'Admin Team'}</li>
                </ul>
                
                <p>As a member of our network, you'll have access to:</p>
                <ul>
                    <li>🔧 Exclusive project opportunities</li>
                    <li>💰 Competitive bidding platform</li>
                    <li>📊 Real-time project management tools</li>
                    <li>💳 Streamlined payment processing</li>
                </ul>
                
                <a href="${data?.signupUrl || '#'}" class="button">Complete Registration</a>
                
                <p>If you have any questions, please don't hesitate to contact our team.</p>
                
                <p>Best regards,<br>
                Monarch Property Management Team</p>
            </div>
            <div class="footer">
                <p>© 2024 Monarch Property Management. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateMaintenanceNotificationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .priority-high { border-left: 4px solid #dc2626; padding-left: 15px; background: #fef2f2; }
            .priority-medium { border-left: 4px solid #f59e0b; padding-left: 15px; background: #fffbeb; }
            .priority-low { border-left: 4px solid #10b981; padding-left: 15px; background: #f0fdf4; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔧 Maintenance Request</h1>
                <p>New maintenance request requires attention</p>
            </div>
            <div class="content">
                <div class="priority-${data?.priority || 'medium'}">
                    <h3>Request Details</h3>
                    <p><strong>Property:</strong> ${data?.propertyName || 'N/A'}</p>
                    <p><strong>Category:</strong> ${data?.category || 'General'}</p>
                    <p><strong>Priority:</strong> ${data?.priority?.toUpperCase() || 'MEDIUM'}</p>
                    <p><strong>Description:</strong> ${data?.description || 'No description provided'}</p>
                    <p><strong>Tenant:</strong> ${data?.tenantName || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${data?.tenantEmail || 'N/A'}</p>
                </div>
                
                <p>Please log into your dashboard to view full details and take action.</p>
                
                <p>Best regards,<br>
                Monarch Property Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generatePaymentReminderEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Payment Due</h1>
                <p>Payment reminder from Monarch Property Management</p>
            </div>
            <div class="content">
                <h2>Payment Due Notice</h2>
                <p><strong>Amount Due:</strong> <span class="amount">$${data?.amount || '0.00'}</span></p>
                <p><strong>Due Date:</strong> ${data?.dueDate || 'N/A'}</p>
                <p><strong>Description:</strong> ${data?.description || 'Payment due'}</p>
                
                <a href="${data?.paymentUrl || '#'}" class="button">Make Payment</a>
                
                <p>Please ensure payment is made by the due date to avoid any late fees.</p>
                
                <p>Best regards,<br>
                Monarch Property Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateBookingConfirmationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Booking Confirmation</h1>
                <p>Your reservation has been confirmed</p>
            </div>
            <div class="content">
                <h2>Thank you for your booking!</h2>
                
                <div class="booking-details">
                    <h3>Booking Details</h3>
                    <p><strong>Property:</strong> ${data?.propertyTitle || 'N/A'}</p>
                    <p><strong>Check-in:</strong> ${data?.checkInDate || 'N/A'}</p>
                    <p><strong>Check-out:</strong> ${data?.checkOutDate || 'N/A'}</p>
                    <p><strong>Guests:</strong> ${data?.guests || '1'}</p>
                    <p><strong>Total Amount:</strong> $${data?.totalAmount || '0.00'}</p>
                    <p><strong>Booking ID:</strong> ${data?.bookingId || 'N/A'}</p>
                </div>
                
                <p>We look forward to hosting you. If you have any questions, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>
                Monarch Property Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateTestEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Email Test Successful</h1>
                <p>Monarch Property Management</p>
            </div>
            <div class="content">
                <div class="success">
                    <h2>Your email system is working!</h2>
                </div>
                <p>Hello ${data?.name || 'User'},</p>
                <p>${data?.message || 'This is a test email to verify the email system is working correctly.'}</p>
                <p>If you received this email, your Resend configuration is properly set up.</p>
                <p>Best regards,<br>Monarch Property Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateWelcomeEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome!</h1>
                <p>Monarch Property Management</p>
            </div>
            <div class="content">
                <h2>Hello ${data?.name || 'there'},</h2>
                <p>Welcome to Monarch Property Management! We're excited to have you on board.</p>
                <p>Your account has been created successfully. You can now access your dashboard and start managing your properties.</p>
                <a href="${data?.dashboardUrl || '#'}" class="button">Go to Dashboard</a>
                <p>If you have any questions, our support team is here to help.</p>
                <p>Best regards,<br>Monarch Property Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateProjectAssignmentEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .project-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7c3aed; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 New Project Assignment</h1>
                <p>You've been assigned to a new project</p>
            </div>
            <div class="content">
                <h2>Hello ${data?.vendorName || 'Vendor'},</h2>
                <p>You have been assigned to a new project. Please review the details below:</p>
                <div class="project-details">
                    <h3>${data?.projectTitle || 'Project'}</h3>
                    <p><strong>Description:</strong> ${data?.projectDescription || 'N/A'}</p>
                    <p><strong>Priority:</strong> ${data?.priority || 'Medium'}</p>
                    <p><strong>Deadline:</strong> ${data?.deadline || 'TBD'}</p>
                    <p><strong>Budget Range:</strong> $${data?.budgetMin || '0'} - $${data?.budgetMax || '0'}</p>
                </div>
                <a href="${data?.projectUrl || '#'}" class="button">View Project Details</a>
                <p>Please accept or decline this assignment at your earliest convenience.</p>
                <p>Best regards,<br>Monarch Property Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generatePasswordResetEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
                <p>Monarch Property Management</p>
            </div>
            <div class="content">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${data?.resetUrl || '#'}" class="button">Reset Password</a>
                <div class="warning">
                    <p><strong>⚠️ Security Notice:</strong></p>
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                    <p>This link will expire in 1 hour for security reasons.</p>
                </div>
                <p>Best regards,<br>Monarch Property Management Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

serve(handler);
