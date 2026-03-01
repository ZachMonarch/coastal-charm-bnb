import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { 
  wrapEmailContent, 
  formatCurrency, 
  sanitizeForEmail,
  BRAND_COLORS,
  SITE_URL 
} from "../_shared/emailHeader.ts";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface PaymentNotificationRequest {
  userId: string;
  type: 'payment_request' | 'payout_received' | 'payment_modified' | 'refund_approved' | 'refund_rejected';
  paymentId: string;
  amount: number;
  title?: string;
  reason?: string;
}

// Generate email body based on notification type
function generatePaymentEmailBody(
  type: string,
  name: string,
  amount: string,
  title?: string,
  reason?: string
): { subject: string; body: string } {
  const dashboardUrl = `${SITE_URL}/payments`;
  const vendorPayoutsUrl = `${SITE_URL}/vendor/payouts`;

  switch (type) {
    case 'payment_request':
      return {
        subject: `Payment Request: ${title}`,
        body: `
          <p class="greeting">Hello ${name},</p>
          
          <p>We hope this message finds you well. You have received a new payment request that requires your attention.</p>
          
          <div class="details-box">
            <h3>Payment Details</h3>
            <p><strong>Description:</strong> ${title}</p>
            <p><strong>Amount Due:</strong> ${amount}</p>
          </div>
          
          <p>Please log in to your account to review the full details and complete the payment at your earliest convenience.</p>
          
          <center>
            <a href="${dashboardUrl}" class="button">View Payment Details</a>
          </center>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
            If you have any questions about this payment request, please don't hesitate to contact our team. We're here to help!
          </p>
          
          <p>Thank you for your prompt attention to this matter.</p>
          
          <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
        `
      };

    case 'payout_received':
      return {
        subject: `Great News! Payout Received: ${amount}`,
        body: `
          <p class="greeting">Hello ${name},</p>
          
          <p>Wonderful news! A payout has been successfully credited to your account.</p>
          
          <div class="amount-highlight">
            ${amount}
          </div>
          
          <div class="details-box">
            <h3>Payout Information</h3>
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Reason:</strong> ${reason || 'Payment for completed services'}</p>
            <p><strong>Status:</strong> <span class="success-badge">Credited</span></p>
          </div>
          
          <p>You can request a withdrawal to your bank account through your vendor dashboard whenever you're ready.</p>
          
          <center>
            <a href="${vendorPayoutsUrl}" class="button">View My Payouts</a>
          </center>
          
          <div class="divider"></div>
          
          <p>Thank you for your continued partnership with Monarch Property Management. We value your excellent work!</p>
          
          <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
        `
      };

    case 'payment_modified':
      return {
        subject: `Payment Updated: ${title}`,
        body: `
          <p class="greeting">Hello ${name},</p>
          
          <p>We're writing to inform you that a payment associated with your account has been updated.</p>
          
          <div class="details-box">
            <h3>Updated Payment Information</h3>
            <p><strong>Description:</strong> ${title}</p>
            <p><strong>Updated Amount:</strong> ${amount}</p>
          </div>
          
          <p>Please review the updated details in your account to ensure everything is accurate.</p>
          
          <center>
            <a href="${dashboardUrl}" class="button">Review Payment</a>
          </center>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
            If you have any questions or concerns about this update, our support team is ready to assist you.
          </p>
          
          <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
        `
      };

    case 'refund_approved':
      return {
        subject: `Refund Approved: ${amount}`,
        body: `
          <p class="greeting">Hello ${name},</p>
          
          <p>Great news! Your refund request has been approved.</p>
          
          <div class="amount-highlight">
            Refund Amount: ${amount}
          </div>
          
          <div class="details-box">
            <h3>Refund Details</h3>
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Status:</strong> <span class="success-badge">Approved</span></p>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>The refund will be processed to your original payment method</li>
            <li>Please allow 5-10 business days for the funds to appear in your account</li>
            <li>You'll receive a confirmation once the refund is completed</li>
          </ul>
          
          <div class="divider"></div>
          
          <p>Thank you for your patience. If you have any questions, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
        `
      };

    case 'refund_rejected':
      return {
        subject: `Refund Request Update`,
        body: `
          <p class="greeting">Hello ${name},</p>
          
          <p>We've reviewed your refund request and wanted to provide you with an update.</p>
          
          <div class="details-box">
            <h3>Request Details</h3>
            <p><strong>Requested Amount:</strong> ${amount}</p>
            <p><strong>Admin Notes:</strong> ${reason || 'Please contact support for more information about this decision.'}</p>
          </div>
          
          <p>We understand this may not be the outcome you were hoping for. If you have any questions or would like to discuss this further, our support team is here to help.</p>
          
          <center>
            <a href="${SITE_URL}/contact" class="button">Contact Support</a>
          </center>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: ${BRAND_COLORS.gray};">
            We value your business and are committed to finding a resolution that works for everyone.
          </p>
          
          <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
        `
      };

    default:
      return {
        subject: 'Payment Notification',
        body: `
          <p class="greeting">Hello ${name},</p>
          <p>You have a new payment notification. Please log in to your account to view the details.</p>
          <center>
            <a href="${dashboardUrl}" class="button">View Details</a>
          </center>
          <p>Best regards,<br><strong>Monarch Property Management Team</strong></p>
        `
      };
  }
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    // SECURITY: Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create client for auth validation
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Validate user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create service role client for role checking (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // SECURITY: Verify user has admin or property_manager role using admin client
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error checking roles:", rolesError);
    }

    const isAuthorized = roles?.some(r => 
      ["admin", "property_manager"].includes(r.role)
    );

    if (!isAuthorized) {
      console.error(`User ${user.id} not authorized for payment notifications`);
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { userId, type, paymentId, amount, title, reason }: PaymentNotificationRequest = await req.json();

    // Get user details using admin client
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      throw new Error("User email not found");
    }

    const sanitizedName = sanitizeForEmail(profile.full_name) || 'Valued Customer';
    const formattedAmount = formatCurrency(amount);
    const sanitizedTitle = sanitizeForEmail(title);
    const sanitizedReason = sanitizeForEmail(reason);

    // Generate email content
    const { subject, body } = generatePaymentEmailBody(
      type,
      sanitizedName,
      formattedAmount,
      sanitizedTitle,
      sanitizedReason
    );

    // Get header subtitle based on type
    const headerSubtitle = type === 'payout_received' 
      ? 'Funds have been added to your account'
      : type === 'refund_approved'
      ? 'Your request has been processed'
      : type === 'refund_rejected'
      ? 'Important update about your request'
      : 'Action required';

    // Wrap with branded template
    const html = wrapEmailContent('Payment Notification', headerSubtitle, body);

    // Generate anti-spam headers
    const emailId = `payment-${type}-${paymentId}-${Date.now()}`;
    const antiSpamHeaders = getAntiSpamHeaders({
      emailId,
      category: `payment-${type}`,
    });

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { error: emailError } = await resend.emails.send({
      from: EMAIL_CONFIG.senders.notifications,
      to: [profile.email],
      reply_to: EMAIL_CONFIG.replyTo,
      subject,
      html,
      headers: antiSpamHeaders,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw emailError;
    }

    console.log(`Payment notification email sent to ${profile.email} for ${type}`);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in send-payment-notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
