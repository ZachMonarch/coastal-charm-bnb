import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface RejectionRequest {
  bid_id: string;
  rfq_id: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bid_id, rfq_id, reason } = await req.json() as RejectionRequest;

    console.log(`Processing bid rejection for bid: ${bid_id}, RFQ: ${rfq_id}`);

    // Fetch bid details
    const { data: bid, error: bidError } = await supabase
      .from("vendor_bids")
      .select("id, vendor_id, bid_amount, company_info, pricing")
      .eq("id", bid_id)
      .single();

    if (bidError || !bid) {
      throw new Error(`Bid not found: ${bidError?.message}`);
    }

    // Fetch RFQ details
    const { data: rfq, error: rfqError } = await supabase
      .from("rfqs")
      .select("id, title, document_control")
      .eq("id", rfq_id)
      .single();

    if (rfqError || !rfq) {
      throw new Error(`RFQ not found: ${rfqError?.message}`);
    }

    // Fetch vendor profile
    const { data: vendorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", bid.vendor_id)
      .single();

    if (profileError || !vendorProfile) {
      throw new Error(`Vendor profile not found: ${profileError?.message}`);
    }

    // Fetch vendor company info
    const { data: vendorData } = await supabase
      .from("vendor_profiles")
      .select("company_name")
      .eq("user_id", bid.vendor_id)
      .single();

    const companyName = vendorData?.company_name || (bid.company_info as Record<string, unknown>)?.company_name || 'Vendor';
    const bidAmount = (bid.pricing as Record<string, number>)?.total_cost || bid.bid_amount || 0;
    const docControl = rfq.document_control as Record<string, unknown>;

    // Send rejection email using fetch to Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Monarch Property Management <projects@monarchpropertymmgt.com>",
        to: [vendorProfile.email],
        subject: `Bid Update: ${rfq.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1a1a2e; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; background: #fff; border: 1px solid #e5e7eb; }
              .notice { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0; }
              .summary { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .btn { 
                display: inline-block; 
                padding: 12px 25px; 
                background: #C9A962; 
                color: #1a1a2e; 
                text-decoration: none; 
                font-weight: bold; 
                border-radius: 5px;
              }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bid Status Update</h1>
              </div>
              <div class="content">
                <p>Dear ${vendorProfile.full_name || companyName},</p>
                
                <p>Thank you for submitting your bid for the following project:</p>
                
                <div class="summary">
                  <p><strong>Project:</strong> ${rfq.title}</p>
                  <p><strong>RFQ Reference:</strong> ${docControl?.rfq_reference || 'N/A'}</p>
                  <p><strong>Your Bid Amount:</strong> $${bidAmount.toLocaleString()}</p>
                </div>
                
                <div class="notice">
                  <p><strong>Status Update:</strong></p>
                  <p>After careful consideration of all submitted bids, we have decided to proceed with another vendor for this project.</p>
                  ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}
                </div>
                
                <p>We truly appreciate your time and effort in preparing this bid. Your participation helps us maintain competitive pricing and quality for our clients.</p>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>You remain an active vendor in our system</li>
                  <li>You will continue to receive invitations for relevant projects</li>
                  <li>Your profile and ratings are unaffected by this decision</li>
                </ul>
                
                <p>We encourage you to continue bidding on future opportunities. New RFQs are posted regularly.</p>
                
                <center style="margin: 30px 0;">
                  <a href="https://monarchpropertymmgt.com/vendor/rfq/dashboard" class="btn">View Available RFQs →</a>
                </center>
                
                <p>If you have any questions about this decision or feedback on your bid, please don't hesitate to reach out.</p>
                
                <p>Best regards,<br>
                <strong>Monarch Property Management</strong><br>
                Projects Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Monarch Property Management</p>
                <p>www.monarchpropertymmgt.com | projects@monarchpropertymmgt.com</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await response.json();

    // Log the notification
    await supabase.from("notifications").insert({
      user_id: bid.vendor_id,
      title: "Bid Update",
      message: `Your bid for "${rfq.title}" was not selected. Thank you for participating.`,
      type: "info",
      category: "rfq",
      action_url: "/vendor/rfq/dashboard",
    });

    console.log(`Rejection email sent successfully to ${vendorProfile.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailData?.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending bid rejection:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
