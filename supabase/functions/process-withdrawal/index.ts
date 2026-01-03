import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { ProcessWithdrawalSchema, createValidationErrorResponse } from "../_shared/validation.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      console.warn(`Unauthorized withdrawal attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Validate input with Zod schema
    const requestBody = await req.json();
    const validationResult = ProcessWithdrawalSchema.safeParse(requestBody);

    if (!validationResult.success) {
      console.warn(`Validation failed for withdrawal request:`, validationResult.error.errors);
      return createValidationErrorResponse(validationResult.error, corsHeaders);
    }

    const { payoutId, action, transactionId, notes } = validationResult.data;
    console.log(`Processing withdrawal ${payoutId} with action ${action} by admin ${user.id}`);

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

  } catch (error: unknown) {
    console.error("Error processing withdrawal:", error);
    // Return generic error to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: "Unable to process withdrawal request",
        code: "WITHDRAWAL_PROCESSING_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
