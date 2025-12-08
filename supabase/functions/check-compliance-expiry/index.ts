import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting compliance expiry check...');

    // Find vendor documents expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringDocs, error: docsError } = await supabase
      .from('vendor_documents')
      .select(`
        id,
        vendor_id,
        document_type,
        expiry_date,
        vendor:vendor_id (
          user_id,
          company_name,
          email
        )
      `)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', new Date().toISOString());

    if (docsError) throw docsError;

    console.log(`Found ${expiringDocs?.length || 0} documents expiring soon`);

    let notificationsSent = 0;

    for (const doc of expiringDocs || []) {
      const vendor = Array.isArray(doc.vendor) ? doc.vendor[0] : doc.vendor;
      if (!vendor?.user_id) continue;

      const daysUntilExpiry = Math.ceil(
        (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: vendor.user_id,
          title: 'Document Expiring Soon',
          message: `Your ${doc.document_type} will expire in ${daysUntilExpiry} days. Please update it to maintain your verification status.`,
          type: 'warning',
          action_url: '/vendor/documents',
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      } else {
        notificationsSent++;
      }

      // If expired, update vendor verification status
      if (new Date(doc.expiry_date) < new Date()) {
        await supabase
          .from('vendor_profiles')
          .update({ is_verified: false })
          .eq('user_id', vendor.user_id);

        console.log(`Vendor ${vendor.user_id} verification revoked due to expired ${doc.document_type}`);
      }
    }

    // Check for expired subscriptions
    const { data: expiredSubs, error: subsError } = await supabase
      .from('vendor_profiles')
      .select('user_id, company_name, subscription_expires_at')
      .eq('subscription_status', 'active')
      .lte('subscription_expires_at', new Date().toISOString());

    if (!subsError && expiredSubs) {
      for (const vendor of expiredSubs) {
        await supabase
          .from('vendor_profiles')
          .update({ subscription_status: 'expired' })
          .eq('user_id', vendor.user_id);

        await supabase
          .from('notifications')
          .insert({
            user_id: vendor.user_id,
            title: 'Subscription Expired',
            message: 'Your subscription has expired. Please renew to continue accessing premium features.',
            type: 'error',
            action_url: '/vendor/subscription',
          });

        notificationsSent++;
      }
    }

    console.log(`Sent ${notificationsSent} compliance notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        expiringDocuments: expiringDocs?.length || 0,
        expiredSubscriptions: expiredSubs?.length || 0,
        notificationsSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in compliance check:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
