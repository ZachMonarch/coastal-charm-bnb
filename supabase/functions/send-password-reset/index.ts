import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimiter.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 3 requests per 15 minutes per IP (stricter for password reset)
const RATE_LIMIT_CONFIG = {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
  endpoint: 'send-password-reset'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Apply rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkRateLimit({
      ...RATE_LIMIT_CONFIG,
      identifier: clientIP
    });

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for send-password-reset from IP: ${clientIP}`);
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    const { email, resetUrl } = await req.json();

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

    // Validate resetUrl is from our domain (prevent phishing)
    if (!resetUrl || !resetUrl.startsWith('https://monarchpropertymmgt.com')) {
      return new Response(
        JSON.stringify({ error: 'Invalid reset URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Monarch Property Management <noreply@monarchpropertymmgt.com>",
      to: [email],
      subject: "Reset Your Password - Monarch Property Management",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C2C2C; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #D4AF37 0%, #C4961A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #D4AF37; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                
                <p>We received a request to reset your password for your Monarch Property Management account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <center>
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </center>
                
                <div class="warning">
                  <p style="margin: 0;"><strong>⚠️ Security Note:</strong></p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                  </ul>
                </div>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #D4AF37; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Monarch Property Management. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Production-safe logging (no PII)
    console.log(`Password reset email sent successfully, email_id: ${emailResponse.data?.id}`);

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
    console.error("Error in send-password-reset:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to send email. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
