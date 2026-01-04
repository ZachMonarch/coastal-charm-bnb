import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { BRAND_COLORS, LOGO_URL, SITE_URL, emailStyles, generateEmailFooter } from "../_shared/emailHeader.ts";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

// Phase 4.4: Validate RESEND_API_KEY exists at startup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  console.error("CRITICAL: RESEND_API_KEY environment variable not set");
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);

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

    // Generate unique email ID for tracking
    const emailId = `email-${emailType || template || 'general'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get anti-spam headers for better deliverability
    const antiSpamHeaders = getAntiSpamHeaders({
      emailId,
      category: emailType || template || 'transactional',
    });

    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.senders.noreply,
      to: [to],
      subject: sanitizedSubject,
      html: emailHtml,
      reply_to: EMAIL_CONFIG.replyTo,
      headers: antiSpamHeaders,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log sent email to sent_emails table for tracking
    try {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await serviceClient.from('sent_emails').insert({
        recipient_email: to,
        recipient_name: data?.name || data?.companyName || null,
        recipient_user_id: recipientProfile?.id || null,
        subject: sanitizedSubject,
        html_content: emailHtml,
        template_used: template || null,
        email_type: emailType || template || 'general',
        status: 'sent',
        sent_by: user.id,
        metadata: {
          messageId: emailResponse.data?.id,
          template_data: data || {}
        }
      });
      console.log("Email logged to sent_emails table");
    } catch (logError) {
      console.warn('Failed to log email to sent_emails:', logError);
      // Don't fail the request if logging fails
    }

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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Invitation</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
                <h1 class="header-title">Vendor Invitation</h1>
                <p class="header-subtitle">Join Our Exclusive Vendor Network</p>
            </div>
            <div class="content">
                <p class="greeting">Hello ${data?.companyName || 'Valued Partner'},</p>
                
                <p>We're excited to invite you to join our exclusive vendor network at Monarch Property Management. As a trusted partner, you'll have access to premium project opportunities and a streamlined collaboration platform.</p>
                
                <div class="details-box">
                    <h3>Invitation Details</h3>
                    <p><strong>Company:</strong> ${data?.companyName || 'Your Company'}</p>
                    <p><strong>Specialties:</strong> ${data?.specialties?.join(', ') || 'Various Services'}</p>
                    <p><strong>Invited by:</strong> ${data?.adminEmail || 'Admin Team'}</p>
                </div>
                
                <p><strong>As a member of our network, you'll enjoy:</strong></p>
                <ul>
                    <li>Priority access to exclusive project opportunities</li>
                    <li>Competitive bidding on property management contracts</li>
                    <li>Real-time project management and communication tools</li>
                    <li>Streamlined payment processing and invoicing</li>
                    <li>Direct relationships with property managers</li>
                </ul>
                
                <center>
                    <a href="${data?.signupUrl || SITE_URL + '/vendor/register'}" class="button">Complete Your Registration</a>
                </center>
                
                <div class="divider"></div>
                
                <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
                    If you have any questions about joining our network, our team is ready to assist you. Simply reply to this email or contact us at support@monarchpropertymmgt.com.
                </p>
                
                <p>We look forward to partnering with you!</p>
                
                <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
            </div>
            ${generateEmailFooter()}
        </div>
    </body>
    </html>
  `;
}

function generateMaintenanceNotificationEmail(data: any): string {
  const priorityColors: Record<string, string> = {
    high: BRAND_COLORS.error,
    medium: BRAND_COLORS.warning,
    low: BRAND_COLORS.success,
  };
  const priority = data?.priority?.toLowerCase() || 'medium';
  const priorityColor = priorityColors[priority] || BRAND_COLORS.warning;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Request</title>
        <style>
            ${emailStyles}
            .priority-badge {
                display: inline-block;
                background: ${priorityColor};
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .request-card {
                background: ${BRAND_COLORS.grayLight};
                border-left: 4px solid ${priorityColor};
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header" style="background: linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%);">
                <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
                <h1 class="header-title">Maintenance Request</h1>
                <p class="header-subtitle">New request requires your attention</p>
            </div>
            <div class="content">
                <p class="greeting">Hello,</p>
                
                <p>A new maintenance request has been submitted and requires your attention. Please review the details below and take appropriate action.</p>
                
                <div class="request-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0; color: ${BRAND_COLORS.charcoal};">Request Details</h3>
                        <span class="priority-badge">${priority} Priority</span>
                    </div>
                    <p><strong>Property:</strong> ${data?.propertyName || 'N/A'}</p>
                    <p><strong>Category:</strong> ${data?.category || 'General Maintenance'}</p>
                    <p><strong>Description:</strong> ${data?.description || 'No description provided'}</p>
                    <div class="divider"></div>
                    <p><strong>Submitted by:</strong> ${data?.tenantName || 'N/A'}</p>
                    <p><strong>Contact Email:</strong> ${data?.tenantEmail || 'N/A'}</p>
                </div>
                
                <p><strong>Recommended Next Steps:</strong></p>
                <ol>
                    <li>Review the maintenance request details in your dashboard</li>
                    <li>Assess the urgency and assign to appropriate vendor if needed</li>
                    <li>Communicate timeline expectations with the tenant</li>
                    <li>Schedule and track the maintenance work</li>
                </ol>
                
                <center>
                    <a href="${SITE_URL}/admin/maintenance" class="button">View in Dashboard</a>
                </center>
                
                <div class="divider"></div>
                
                <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
                    This is an automated notification. Please do not reply directly to this email. For questions or issues, contact the support team.
                </p>
                
                <p>Best regards,<br><strong>Monarch Property Management System</strong></p>
            </div>
            ${generateEmailFooter()}
        </div>
    </body>
    </html>
  `;
}

function generatePaymentReminderEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
                <h1 class="header-title">Payment Reminder</h1>
                <p class="header-subtitle">Action required</p>
            </div>
            <div class="content">
                <p class="greeting">Hello,</p>
                
                <p>This is a friendly reminder that you have an upcoming payment due. Please review the details below and complete your payment at your earliest convenience.</p>
                
                <div class="amount-highlight">
                    Amount Due: $${data?.amount || '0.00'}
                </div>
                
                <div class="details-box">
                    <h3>Payment Details</h3>
                    <p><strong>Description:</strong> ${data?.description || 'Payment due'}</p>
                    <p><strong>Due Date:</strong> ${data?.dueDate || 'N/A'}</p>
                </div>
                
                <center>
                    <a href="${data?.paymentUrl || SITE_URL + '/payments'}" class="button">Make Payment Now</a>
                </center>
                
                <div class="divider"></div>
                
                <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
                    Please ensure payment is made by the due date to avoid any late fees. If you've already made this payment, please disregard this reminder.
                </p>
                
                <p>If you have any questions about this payment, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
            </div>
            ${generateEmailFooter()}
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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
                <h1 class="header-title">Email Test Successful</h1>
                <p class="header-subtitle">Your email system is configured correctly</p>
            </div>
            <div class="content">
                <div style="text-align: center; padding: 20px; background: ${BRAND_COLORS.success}15; border-radius: 8px; margin-bottom: 24px;">
                    <span style="font-size: 48px;">✓</span>
                    <h2 style="color: ${BRAND_COLORS.success}; margin: 10px 0 0 0;">Email System Working!</h2>
                </div>
                
                <p class="greeting">Hello ${data?.name || 'User'},</p>
                
                <p>${data?.message || 'This is a test email to verify the email system is working correctly.'}</p>
                
                <p>If you received this email, your Resend configuration is properly set up and emails are being delivered successfully.</p>
                
                <div class="divider"></div>
                
                <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
                    This is an automated test message. No action is required.
                </p>
                
                <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
            </div>
            ${generateEmailFooter()}
        </div>
    </body>
    </html>
  `;
}

function generateWelcomeEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
                <h1 class="header-title">Welcome Aboard!</h1>
                <p class="header-subtitle">Your account has been created successfully</p>
            </div>
            <div class="content">
                <p class="greeting">Hello ${data?.name || 'there'},</p>
                
                <p>Welcome to <strong>Monarch Property Management</strong>! We're thrilled to have you join our community of property management professionals.</p>
                
                <p>Your account has been created successfully and you're now ready to explore all the powerful features our platform has to offer.</p>
                
                <div class="details-box">
                    <h3>Getting Started</h3>
                    <p>Here's what you can do next:</p>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                        <li>Complete your profile with your details</li>
                        <li>Explore your personalized dashboard</li>
                        <li>Connect with vendors and manage properties</li>
                    </ul>
                </div>
                
                <center>
                    <a href="${data?.dashboardUrl || SITE_URL + '/dashboard'}" class="button">Go to Dashboard</a>
                </center>
                
                <div class="divider"></div>
                
                <p>If you have any questions or need assistance getting started, our support team is available 24/7 to help you.</p>
                
                <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
            </div>
            ${generateEmailFooter()}
        </div>
    </body>
    </html>
  `;
}

function generateProjectAssignmentEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Assignment</title>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
                <h1 class="header-title">New Project Assignment</h1>
                <p class="header-subtitle">You've been selected for a new project</p>
            </div>
            <div class="content">
                <p class="greeting">Hello ${data?.vendorName || 'Vendor'},</p>
                
                <p>Great news! You have been assigned to a new project. We've selected you based on your expertise and track record of excellent work.</p>
                
                <div class="details-box">
                    <h3>${data?.projectTitle || 'Project Details'}</h3>
                    <p><strong>Description:</strong> ${data?.projectDescription || 'N/A'}</p>
                    <p><strong>Priority:</strong> ${data?.priority || 'Medium'}</p>
                    <p><strong>Deadline:</strong> ${data?.deadline || 'To be determined'}</p>
                    <p><strong>Budget Range:</strong> $${data?.budgetMin || '0'} - $${data?.budgetMax || '0'}</p>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li>Review the full project details in your dashboard</li>
                    <li>Accept or decline the assignment within 48 hours</li>
                    <li>If accepted, confirm your availability and timeline</li>
                </ol>
                
                <center>
                    <a href="${data?.projectUrl || SITE_URL + '/vendor/projects'}" class="button">View Project Details</a>
                </center>
                
                <div class="divider"></div>
                
                <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
                    Please respond to this assignment at your earliest convenience. If you have any questions, our project management team is here to help.
                </p>
                
                <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
            </div>
            ${generateEmailFooter()}
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
