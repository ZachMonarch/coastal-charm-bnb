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
      .select("id, vendor_id, amount, status, reference, metadata")
      .eq("id", payoutId)
      .single();

    if (payoutError || !payout) {
      throw new Error("Payout not found");
    }

    if (payout.status !== "pending") {
      throw new Error("Payout has already been processed");
    }

    if (action === "approve") {
      // Update payout to processing status
      await supabaseClient
        .from("vendor_payouts")
        .update({
          status: "processing",
          transaction_id: transactionId,
          metadata: {
            ...payout.metadata,
            processed_by: user.id,
            processed_at: new Date().toISOString(),
            notes,
          },
        })
        .eq("id", payoutId);

      // Create notification for vendor
      await supabaseClient.from("notifications").insert({
        user_id: payout.vendor_id,
        title: "Withdrawal Processing",
        message: `Your withdrawal of $${payout.amount.toFixed(2)} is being processed. ${transactionId ? `Transaction ID: ${transactionId}` : ""}`,
        type: "info",
        category: "payment",
      });

    } else if (action === "complete") {
      // Mark payout as completed
      await supabaseClient
        .from("vendor_payouts")
        .update({
          status: "completed",
          payout_date: new Date().toISOString(),
          transaction_id: transactionId,
          metadata: {
            ...payout.metadata,
            completed_by: user.id,
            completed_at: new Date().toISOString(),
            notes,
          },
        })
        .eq("id", payoutId);

      // Create notification for vendor
      await supabaseClient.from("notifications").insert({
        user_id: payout.vendor_id,
        title: "Withdrawal Completed",
        message: `Your withdrawal of $${payout.amount.toFixed(2)} has been completed. ${transactionId ? `Transaction ID: ${transactionId}` : ""}`,
        type: "success",
        category: "payment",
      });

    } else if (action === "reject") {
      // Mark payout as failed
      await supabaseClient
        .from("vendor_payouts")
        .update({
          status: "failed",
          metadata: {
            ...payout.metadata,
            rejected_by: user.id,
            rejected_at: new Date().toISOString(),
            rejection_reason: notes,
          },
        })
        .eq("id", payoutId);

      // Create notification for vendor
      await supabaseClient.from("notifications").insert({
        user_id: payout.vendor_id,
        title: "Withdrawal Issue",
        message: `There was an issue with your withdrawal request. ${notes || "Please contact support."}`,
        type: "warning",
        category: "payment",
      });
    }

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
