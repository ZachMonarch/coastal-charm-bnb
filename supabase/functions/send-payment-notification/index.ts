import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  userId: string;
  type: 'payment_request' | 'payout_received' | 'payment_modified' | 'refund_approved' | 'refund_rejected';
  paymentId: string;
  amount: number;
  title?: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Prepare email content based on type
    let subject = "";
    let html = "";
    const formattedAmount = `$${amount.toFixed(2)}`;

    switch (type) {
      case 'payment_request':
        subject = `Payment Request: ${title}`;
        html = `
          <h1>Payment Request</h1>
          <p>Hello ${profile.full_name || 'there'},</p>
          <p>You have received a new payment request:</p>
          <ul>
            <li><strong>Title:</strong> ${title}</li>
            <li><strong>Amount:</strong> ${formattedAmount}</li>
          </ul>
          <p>Please log in to your account to view details and make payment.</p>
          <a href="${Deno.env.get("SITE_URL") || "https://monarchpropertymmgt.com"}/payments" 
             style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">
            View Payment
          </a>
        `;
        break;

      case 'payout_received':
        subject = `Payout Received: ${formattedAmount}`;
        html = `
          <h1>Payout Received</h1>
          <p>Hello ${profile.full_name || 'there'},</p>
          <p>You have received a payout:</p>
          <ul>
            <li><strong>Amount:</strong> ${formattedAmount}</li>
            <li><strong>Reason:</strong> ${reason || 'Payment for services'}</li>
          </ul>
          <p>You can request withdrawal from your vendor dashboard.</p>
          <a href="${Deno.env.get("SITE_URL") || "https://monarchpropertymmgt.com"}/vendor/payouts" 
             style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">
            View Payouts
          </a>
        `;
        break;

      case 'payment_modified':
        subject = `Payment Updated: ${title}`;
        html = `
          <h1>Payment Updated</h1>
          <p>Hello ${profile.full_name || 'there'},</p>
          <p>A payment has been updated:</p>
          <ul>
            <li><strong>Title:</strong> ${title}</li>
            <li><strong>New Amount:</strong> ${formattedAmount}</li>
          </ul>
          <p>Please review the updated details in your account.</p>
          <a href="${Deno.env.get("SITE_URL") || "https://monarchpropertymmgt.com"}/payments" 
             style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">
            View Payment
          </a>
        `;
        break;

      case 'refund_approved':
        subject = `Refund Approved: ${formattedAmount}`;
        html = `
          <h1>Refund Approved</h1>
          <p>Hello ${profile.full_name || 'there'},</p>
          <p>Your refund request has been approved:</p>
          <ul>
            <li><strong>Amount:</strong> ${formattedAmount}</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>
          <p>The refund will be processed to your original payment method within 5-10 business days.</p>
        `;
        break;

      case 'refund_rejected':
        subject = `Refund Request Update`;
        html = `
          <h1>Refund Request Update</h1>
          <p>Hello ${profile.full_name || 'there'},</p>
          <p>Your refund request has been reviewed:</p>
          <ul>
            <li><strong>Amount:</strong> ${formattedAmount}</li>
            <li><strong>Admin Note:</strong> ${reason || 'Please contact support for more information'}</li>
          </ul>
        `;
        break;
    }

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { error: emailError } = await resend.emails.send({
      from: "Monarch Property Management <notifications@monarchpropertymmgt.com>",
      to: [profile.email],
      subject,
      html,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw emailError;
    }

    console.log(`Email notification sent to ${profile.email} for ${type}`);

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
