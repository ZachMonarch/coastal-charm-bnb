import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RFQInvitationRequest {
  rfq_id: string;
  vendor_ids: string[];
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

    const { rfq_id, vendor_ids }: RFQInvitationRequest = await req.json();

    console.log(`Sending RFQ invitations for RFQ ${rfq_id} to ${vendor_ids.length} vendors`);

    // Fetch RFQ details
    const { data: rfq, error: rfqError } = await supabaseClient
      .from("rfqs")
      .select("id, title, description, deadline, property:properties(title, address)")
      .eq("id", rfq_id)
      .single();

    if (rfqError) throw rfqError;

    // Fetch vendor profiles
    const { data: vendors, error: vendorsError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", vendor_ids);

    if (vendorsError) throw vendorsError;

    const emailPromises = vendors.map(async (vendor) => {
      // Extract property correctly
      const property: any = Array.isArray(rfq.property) ? rfq.property[0] : rfq.property;
      
      const emailResponse = await resend.emails.send({
        from: "Monarch Property Management <noreply@monarchpropertymmgt.com>",
        to: [vendor.email],
        subject: `New RFQ Invitation: ${rfq.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C2C2C; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .details { background: #F9FAFB; padding: 15px; border-left: 4px solid #D4AF37; margin: 20px 0; }
                .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>New RFQ Invitation</h1>
                </div>
                <div class="content">
                  <p>Hello ${vendor.full_name},</p>
                  
                  <p>You have been invited to submit a bid for the following Request for Quotation (RFQ):</p>
                  
                  <div class="details">
                    <h3 style="margin-top: 0; color: #D4AF37;">${rfq.title}</h3>
                    <p><strong>Property:</strong> ${property?.title || 'N/A'}</p>
                    <p><strong>Location:</strong> ${property?.address || 'N/A'}</p>
                    <p><strong>Deadline:</strong> ${new Date(rfq.deadline).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    <p><strong>Description:</strong><br>${rfq.description}</p>
                  </div>
                  
                  <p>This is an excellent opportunity to work with Monarch Property Management. Please review the RFQ details and submit your competitive bid.</p>
                  
                  <center>
                    <a href="https://monarchpropertymmgt.com/vendor/rfqs/${rfq_id}" class="button">View RFQ & Submit Bid</a>
                  </center>
                  
                  <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">If you have any questions, please contact our procurement team.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Monarch Property Management. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`Email sent to ${vendor.email}:`, emailResponse);
      return emailResponse;
    });

    const results = await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ success: true, sent: results.length, rfq_id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-rfq-invitation function:", error);
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
