import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ReminderRequest {
  rfq_id: string;
  reminder_type: '48h' | '24h' | '4h';
}

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify cron secret to prevent unauthorized triggering
    const cronSecret = Deno.env.get('INTERNAL_CRON_SECRET');
    const providedSecret = req.headers.get('X-Cron-Secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!cronSecret || providedSecret !== cronSecret) {
      console.warn('Unauthorized bid deadline reminder attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rfq_id, reminder_type } = await req.json() as ReminderRequest;

    console.log(`Processing ${reminder_type} deadline reminder for RFQ: ${rfq_id}`);

    // Fetch RFQ details
    const { data: rfq, error: rfqError } = await supabase
      .from("rfqs")
      .select("id, title, deadline, status, property_id, document_control")
      .eq("id", rfq_id)
      .single();

    if (rfqError || !rfq) {
      throw new Error(`RFQ not found: ${rfqError?.message}`);
    }

    if (rfq.status !== 'open') {
      console.log(`RFQ ${rfq_id} is not open, skipping reminder`);
      return new Response(JSON.stringify({ success: true, message: "RFQ not open" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get vendors who were invited but haven't submitted
    const { data: invites, error: invitesError } = await supabase
      .from("rfq_invites")
      .select("vendor_id, status")
      .eq("rfq_id", rfq_id);

    if (invitesError) throw invitesError;

    // Get vendors who have already submitted bids
    const { data: existingBids, error: bidsError } = await supabase
      .from("vendor_bids")
      .select("vendor_id")
      .eq("rfq_id", rfq_id);

    if (bidsError) throw bidsError;

    const submittedVendorIds = new Set(existingBids?.map(b => b.vendor_id) || []);
    const pendingVendors = invites?.filter(i => !submittedVendorIds.has(i.vendor_id)) || [];

    console.log(`Found ${pendingVendors.length} vendors who haven't submitted`);

    // Get vendor emails
    const vendorIds = pendingVendors.map(v => v.vendor_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", vendorIds);

    if (profilesError) throw profilesError;

    const deadline = new Date(rfq.deadline);
    const formattedDeadline = deadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const reminderText = {
      '48h': '48 hours',
      '24h': '24 hours',
      '4h': '4 hours (FINAL REMINDER)',
    }[reminder_type];

    const urgencyLevel = reminder_type === '4h' ? 'URGENT' : reminder_type === '24h' ? 'Important' : 'Reminder';

    // Send emails to each vendor using fetch to Resend API
    const emailPromises = (profiles || []).map(async (profile) => {
      const rfqUrl = `https://monarchpropertymmgt.online/vendor/rfq/${rfq_id}`;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Monarch Property Management <projects@monarchpropertymmgt.online>",
            to: [profile.email],
            subject: `[${urgencyLevel}] ${reminderText} Left - ${rfq.title}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: ${reminder_type === '4h' ? '#dc2626' : '#1a1a2e'}; color: white; padding: 30px; text-align: center; }
                  .content { padding: 30px; background: #fff; }
                  .urgency { 
                    background: ${reminder_type === '4h' ? '#fef2f2' : '#fff7ed'}; 
                    border-left: 4px solid ${reminder_type === '4h' ? '#dc2626' : '#f59e0b'}; 
                    padding: 15px; 
                    margin: 20px 0; 
                  }
                  .btn { 
                    display: inline-block; 
                    padding: 15px 30px; 
                    background: #C9A962; 
                    color: #1a1a2e; 
                    text-decoration: none; 
                    font-weight: bold; 
                    border-radius: 5px;
                    margin: 20px 0;
                  }
                  .countdown { font-size: 24px; font-weight: bold; color: ${reminder_type === '4h' ? '#dc2626' : '#f59e0b'}; }
                  .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⏰ Bid Deadline Approaching</h1>
                  </div>
                  <div class="content">
                    <p>Dear ${profile.full_name || 'Vendor'},</p>
                    
                    <div class="urgency">
                      <p class="countdown">Only ${reminderText} remaining!</p>
                      <p>The deadline for submitting your bid is approaching fast.</p>
                    </div>
                    
                    <h2>${rfq.title}</h2>
                    <p><strong>Project:</strong> ${(rfq.document_control as Record<string, unknown>)?.project_name || 'N/A'}</p>
                    <p><strong>Deadline:</strong> ${formattedDeadline}</p>
                    
                    <p>Don't miss this opportunity! Submit your bid now to be considered for this project.</p>
                    
                    <center>
                      <a href="${rfqUrl}" class="btn">Submit Your Bid Now →</a>
                    </center>
                    
                    ${reminder_type === '4h' ? `
                    <div class="urgency" style="background: #fef2f2; border-color: #dc2626;">
                      <p><strong>⚠️ This is your final reminder.</strong> Bids submitted after the deadline will not be accepted.</p>
                    </div>
                    ` : ''}
                    
                    <p>If you have any questions, please contact us at projects@monarchpropertymmgt.online</p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Monarch Property Management</p>
                    <p>www.monarchpropertymmgt.online</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (!response.ok) {
          throw new Error(`Resend API error: ${response.status}`);
        }

        console.log(`Sent ${reminder_type} reminder to ${profile.email}`);
        return { success: true, email: profile.email };
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
        return { success: false, email: profile.email, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${results.length} deadline reminder emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: results.length,
        reminder_type 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending deadline reminders:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
