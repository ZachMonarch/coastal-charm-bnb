import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) throw new Error("Unauthorized");

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) throw new Error("Only admins can process withdrawals");

    const { payoutId, action, transactionId, notes } = await req.json();

    if (!payoutId || !action) {
      throw new Error("Missing payoutId or action");
    }

    // Get payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from("vendor_payouts")
      .select("id, vendor_id, amount, status, reference, notes, metadata")
      .eq("id", payoutId)
      .single();

    if (payoutError || !payout) {
      throw new Error("Payout not found");
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'approve': ['pending'],
      'complete': ['pending', 'approved'],
      'reject': ['pending', 'approved']
    };

    if (!validTransitions[action]?.includes(payout.status)) {
      throw new Error(`Cannot ${action} a payout with status: ${payout.status}`);
    }

    let newStatus = '';
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType: 'info' | 'success' | 'warning' = 'info';

    if (action === "approve") {
      newStatus = 'approved';
      notificationTitle = 'Withdrawal Approved';
      notificationMessage = `Your withdrawal of $${payout.amount.toFixed(2)} has been approved and will be processed soon.`;
      notificationType = 'info';

      await supabaseClient
        .from("vendor_payouts")
        .update({
          status: newStatus,
          processed_by: user.id,
          notes: notes || payout.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId);

    } else if (action === "complete") {
      if (!transactionId) {
        throw new Error("Transaction ID is required for completion");
      }

      newStatus = 'completed';
      notificationTitle = 'Withdrawal Completed';
      notificationMessage = `Your withdrawal of $${payout.amount.toFixed(2)} has been completed. Transaction ID: ${transactionId}`;
      notificationType = 'success';

      await supabaseClient
        .from("vendor_payouts")
        .update({
          status: newStatus,
          payout_date: new Date().toISOString(),
          transaction_id: transactionId,
          reference: transactionId,
          processed_by: user.id,
          notes: notes || payout.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId);

    } else if (action === "reject") {
      newStatus = 'rejected';
      notificationTitle = 'Withdrawal Rejected';
      notificationMessage = notes 
        ? `Your withdrawal request was rejected: ${notes}`
        : 'Your withdrawal request was rejected. Please contact support for details.';
      notificationType = 'warning';

      await supabaseClient
        .from("vendor_payouts")
        .update({
          status: newStatus,
          processed_by: user.id,
          notes: notes || 'Rejected by admin',
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId);
    }

    // Create notification for vendor
    await supabaseClient.from("notifications").insert({
      user_id: payout.vendor_id,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      category: 'payment',
      action_url: '/vendor/payouts'
    });

    // Audit log
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: `PAYOUT_${action.toUpperCase()}`,
      table_name: 'vendor_payouts',
      record_id: payoutId,
      old_values: { status: payout.status },
      new_values: { 
        status: newStatus, 
        transaction_id: transactionId,
        notes: notes,
        processed_by: user.id
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: `Withdrawal ${action}d successfully` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
