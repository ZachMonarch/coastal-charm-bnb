import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization - only admin can trigger this
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { vendorId, vendorEmail, vendorName, amount, reference, notes } = await req.json();

    // Validate required fields
    if (!vendorEmail || !amount) {
      return new Response(
        JSON.stringify({ error: 'Vendor email and amount are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Sanitize inputs
    const sanitizedName = (vendorName || 'Vendor').replace(/[<>]/g, '');
    const sanitizedReference = (reference || 'N/A').replace(/[<>]/g, '');
    const sanitizedNotes = notes ? notes.replace(/[<>]/g, '') : '';
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Generate anti-spam headers
    const emailId = `payout-${vendorId}-${Date.now()}`;
    const headers = getAntiSpamHeaders({
      emailId,
      category: 'payout-notification',
    });

    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.senders.payouts,
      to: [vendorEmail],
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `💰 New Payout Available - $${formattedAmount}`,
      headers,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C2C2C; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .amount-box { background: linear-gradient(135deg, #D4AF37 0%, #C4961A 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
              .amount { font-size: 48px; font-weight: bold; margin: 0; }
              .button { display: inline-block; background: #D4AF37; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
              .detail-label { color: #6B7280; }
              .detail-value { font-weight: 600; }
              .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px; }
              .note-box { background: #FEF3C7; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Payout Available!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">A new payout has been issued to your account</p>
              </div>
              <div class="content">
                <p>Hello ${sanitizedName},</p>
                
                <p>Great news! A payout has been issued to your vendor account:</p>
                
                <div class="amount-box">
                  <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">PAYOUT AMOUNT</p>
                  <p class="amount">$${formattedAmount}</p>
                </div>
                
                <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <div class="detail-row">
                    <span class="detail-label">Reference</span>
                    <span class="detail-value">${sanitizedReference}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date Issued</span>
                    <span class="detail-value">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span class="detail-label">Status</span>
                    <span class="detail-value" style="color: #10B981;">Available for Withdrawal</span>
                  </div>
                </div>
                
                ${sanitizedNotes ? `
                <div class="note-box">
                  <strong>📝 Admin Notes:</strong>
                  <p style="margin: 10px 0 0 0;">${sanitizedNotes}</p>
                </div>
                ` : ''}
                
                <p>To request a withdrawal, please visit your vendor dashboard and acknowledge the payout.</p>
                
                <center>
                  <a href="${EMAIL_CONFIG.siteUrl}/vendor/payouts" class="button">
                    View Payout Details →
                  </a>
                </center>
                
                <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
                  <strong>Important:</strong> Ensure your payout settings are configured to receive withdrawals. 
                  If you have any questions, please contact our support team.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${EMAIL_CONFIG.company.name}. All rights reserved.</p>
                <p style="margin-top: 10px;">
                  <a href="${EMAIL_CONFIG.privacyUrl}" style="color: #6B7280; text-decoration: none;">Privacy Policy</a> | 
                  <a href="${EMAIL_CONFIG.termsUrl}" style="color: #6B7280; text-decoration: none;">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`Payout notification sent to vendor ${vendorId}, email_id: ${emailResponse.data?.id}`);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payout-notification:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
