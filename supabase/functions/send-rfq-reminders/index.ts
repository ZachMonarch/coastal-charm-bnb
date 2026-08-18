import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify cron secret to prevent unauthorized triggering
    const cronSecret = Deno.env.get('INTERNAL_CRON_SECRET');
    const providedSecret = req.headers.get('X-Cron-Secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (cronSecret && providedSecret !== cronSecret) {
      console.warn('Unauthorized cron job attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting RFQ reminder job...');

    // Find RFQs that are open and deadline is within 48 hours
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setHours(twoDaysFromNow.getHours() + 48);

    const { data: rfqs, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        id,
        title,
        deadline,
        created_by,
        rfq_invites (
          vendor_id,
          status,
          vendor:vendor_id (
            user_id,
            company_name,
            email
          )
        )
      `)
      .eq('status', 'open')
      .lte('deadline', twoDaysFromNow.toISOString())
      .gte('deadline', new Date().toISOString());

    if (rfqError) throw rfqError;

    console.log(`Found ${rfqs?.length || 0} RFQs with upcoming deadlines`);

    let remindersent = 0;

    for (const rfq of rfqs || []) {
      // Send reminders to vendors who haven't submitted bids yet
      const pendingInvites = rfq.rfq_invites?.filter(
        (invite: any) => invite.status === 'invited'
      );

      for (const invite of pendingInvites || []) {
        const vendor = Array.isArray(invite.vendor) ? invite.vendor[0] : invite.vendor;
        if (!vendor?.email) continue;

        // Create notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: vendor.user_id,
            title: 'RFQ Deadline Reminder',
            message: `The RFQ "${rfq.title}" deadline is approaching. Please submit your bid soon.`,
            type: 'warning',
            action_url: `/vendor/rfq/${rfq.id}`,
          });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        } else {
          remindersent++;
        }
      }
    }

    console.log(`Sent ${remindersent} RFQ reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        rfqsProcessed: rfqs?.length || 0,
        remindersSent: remindersent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in RFQ reminder job:', error);
    return new Response(
      JSON.stringify({ error: 'RFQ reminder job failed', code: 'RFQ_REMINDERS_FAILED' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
