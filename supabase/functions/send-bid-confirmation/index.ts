import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BidConfirmationRequest {
  rfq_id: string;
  vendor_id: string;
  total_amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { rfq_id, vendor_id, total_amount }: BidConfirmationRequest = await req.json();

    console.log(`Sending bid confirmation for RFQ ${rfq_id} from vendor ${vendor_id}`);

    // Fetch RFQ and vendor details
    const [{ data: rfq }, { data: vendor }] = await Promise.all([
      supabaseClient.from("rfqs").select("title, deadline").eq("id", rfq_id).single(),
      supabaseClient.from("profiles").select("full_name, email").eq("id", vendor_id).single(),
    ]);

    if (!rfq || !vendor) throw new Error("RFQ or vendor not found");

    // Generate anti-spam headers
    const emailId = `bid-confirm-${rfq_id}-${vendor_id}-${Date.now()}`;
    const headers = getAntiSpamHeaders({
      emailId,
      category: 'bid-confirmation',
    });

    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.senders.noreply,
      to: [vendor.email],
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `Bid Confirmation: ${rfq.title}`,
      headers,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C2C2C; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .success-icon { font-size: 48px; }
              .details { background: #F9FAFB; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }
              .amount { font-size: 24px; font-weight: bold; color: #10B981; text-align: center; margin: 20px 0; }
              .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✓</div>
                <h1>Bid Submitted Successfully</h1>
              </div>
              <div class="content">
                <p>Hello ${vendor.full_name},</p>
                
                <p>Your bid has been successfully submitted for:</p>
                
                <div class="details">
                  <h3 style="margin-top: 0;">${rfq.title}</h3>
                  <p><strong>Deadline:</strong> ${new Date(rfq.deadline).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
                
                <div class="amount">
                  Total Bid Amount: $${total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Our procurement team will review all submitted bids</li>
                  <li>We'll evaluate proposals based on price, quality, and timeline</li>
                  <li>You'll be notified of the decision by ${new Date(rfq.deadline).toLocaleDateString('en-US', { dateStyle: 'long' })}</li>
                  <li>If selected, we'll contact you to finalize the contract</li>
                </ul>
                
                <p>You can track your bid status in your vendor dashboard at any time.</p>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">Thank you for your submission. We appreciate your interest in working with ${EMAIL_CONFIG.company.name}.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${EMAIL_CONFIG.company.name}. All rights reserved.</p>
                <p style="font-size: 12px; color: #9CA3AF;">
                  ${EMAIL_CONFIG.company.phone1} | ${EMAIL_CONFIG.company.email}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`Confirmation email sent to ${vendor.email}:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-bid-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
