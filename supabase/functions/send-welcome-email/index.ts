import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Rate limit: 5 requests per 15 minutes per IP
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  endpoint: 'send-welcome-email'
};

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Apply rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkRateLimit({
      ...RATE_LIMIT_CONFIG,
      identifier: clientIP
    });

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for send-welcome-email from IP: ${clientIP}`);
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    const { email, name, role } = await req.json();

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const dashboardUrl = role === 'vendor' 
      ? 'https://monarchpropertymmgt.online/vendor'
      : role === 'admin'
      ? 'https://monarchpropertymmgt.online/admin'
      : 'https://monarchpropertymmgt.online/dashboard';

    // Sanitize name to prevent XSS in email
    const sanitizedName = (name || 'User').replace(/[<>]/g, '');

    // Generate unique email ID for tracking
    const emailId = `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get anti-spam headers for better deliverability
    const antiSpamHeaders = getAntiSpamHeaders({
      emailId,
      category: 'welcome',
    });

    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.senders.welcome,
      to: [email],
      subject: "Welcome to Monarch Property Management!",
      reply_to: EMAIL_CONFIG.replyTo,
      headers: antiSpamHeaders,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C2C2C; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #D4AF37 0%, #C4961A 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
              .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .feature { background: #F9FAFB; padding: 15px; margin: 15px 0; border-left: 4px solid #D4AF37; }
              .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">👑 MONARCH</div>
                <h1 style="margin: 0;">Welcome Aboard!</h1>
              </div>
              <div class="content">
                <p>Hello ${sanitizedName},</p>
                
                <p>Welcome to <strong>Monarch Property Management</strong> – your premium partner in property excellence!</p>
                
                <p>We're thrilled to have you join our community. Here's what you can do now:</p>
                
                <div class="feature">
                  <h3 style="margin-top: 0; color: #D4AF37;">✓ Access Your Dashboard</h3>
                  <p>Your personalized dashboard is ready with all the tools you need.</p>
                </div>
                
                <div class="feature">
                  <h3 style="margin-top: 0; color: #D4AF37;">✓ Complete Your Profile</h3>
                  <p>Add your details to unlock the full platform experience.</p>
                </div>
                
                ${role === 'vendor' ? `
                <div class="feature">
                  <h3 style="margin-top: 0; color: #D4AF37;">✓ Browse RFQ Opportunities</h3>
                  <p>Start bidding on projects and grow your business with us.</p>
                </div>
                ` : ''}
                
                <center>
                  <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                </center>
                
                <p style="margin-top: 30px;">Need help getting started? Our support team is here for you 24/7.</p>
                
                <p style="color: #6B7280; font-size: 14px;">If you have any questions, reply to this email or contact us at support@monarchpropertymmgt.online</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Monarch Property Management. All rights reserved.</p>
                <p style="margin-top: 10px;">
                  <a href="https://monarchpropertymmgt.online/privacy" style="color: #6B7280; text-decoration: none;">Privacy Policy</a> | 
                  <a href="https://monarchpropertymmgt.online/terms" style="color: #6B7280; text-decoration: none;">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Production-safe logging (no PII)
    console.log(`Welcome email sent successfully, email_id: ${emailResponse.data?.id}`);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    // Generic error message to client, detailed log server-side
    console.error("Error in send-welcome-email:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to send email. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
