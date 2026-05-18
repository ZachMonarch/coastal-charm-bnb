import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface RFQInvitationRequest {
  rfq_id?: string;
  vendor_ids?: string[];
  rfqId?: string;
  rfqTitle?: string;
  vendorEmail?: string;
  vendorName?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const canInvite = roles?.some((r) => r.role === "admin" || r.role === "property_manager");
    if (!canInvite) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: RFQInvitationRequest = await req.json();
    const rfq_id = body.rfq_id ?? body.rfqId;
    const directRecipient = body.vendorEmail
      ? [{ id: body.vendorEmail, email: body.vendorEmail, full_name: body.vendorName ?? body.vendorEmail }]
      : null;
    const vendor_ids = body.vendor_ids ?? [];

    if (!rfq_id || (!directRecipient && vendor_ids.length === 0)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending RFQ invitations for RFQ ${rfq_id}`);

    // Fetch RFQ details
    const { data: rfq, error: rfqError } = await supabaseClient
      .from("rfqs")
      .select("id, title, description, deadline, property:properties(title, address)")
      .eq("id", rfq_id)
      .single();

    if (rfqError) throw rfqError;

    // Fetch vendor profiles
    const { data: vendors, error: vendorsError } = directRecipient
      ? { data: directRecipient, error: null }
      : await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", vendor_ids);

    if (vendorsError) throw vendorsError;

    const emailPromises = vendors.map(async (vendor) => {
      // Extract property correctly
      const property: any = Array.isArray(rfq.property) ? rfq.property[0] : rfq.property;
      
      // Generate anti-spam headers for each email
      const emailId = `rfq-invite-${rfq_id}-${vendor.id}-${Date.now()}`;
      const headers = getAntiSpamHeaders({
        emailId,
        category: 'rfq-invitation',
      });

      const emailResponse = await resend.emails.send({
        from: EMAIL_CONFIG.senders.noreply,
        to: [vendor.email],
        reply_to: EMAIL_CONFIG.replyTo,
        subject: `New RFQ Invitation: ${rfq.title}`,
        headers,
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
                    <a href="${EMAIL_CONFIG.siteUrl}/rfq/${rfq_id}" class="button">View RFQ & Request Access</a>
                  </center>
                  
                  <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">If you have any questions, please contact our procurement team.</p>
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
      JSON.stringify({ error: "Failed to send RFQ invitation", code: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
