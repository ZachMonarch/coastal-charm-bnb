import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { ProcessRefundSchema, createValidationErrorResponse } from "../_shared/validation.ts";
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
      console.warn(`Unauthorized refund attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Validate input with Zod schema
    const requestBody = await req.json();
    const validationResult = ProcessRefundSchema.safeParse(requestBody);

    if (!validationResult.success) {
      console.warn(`Validation failed for refund request:`, validationResult.error.errors);
      return createValidationErrorResponse(validationResult.error, corsHeaders);
    }

    const { refundId, action, adminNotes } = validationResult.data;
    console.log(`Processing refund ${refundId} with action ${action} by admin ${user.id}`);

    // Get refund details
    const { data: refundData, error: refundError } = await supabaseClient
      .from("payment_refunds")
      .select(`
        id,
        payment_id,
        amount,
        reason,
        requested_by
      `)
      .eq("id", refundId)
      .single();

    if (refundError || !refundData) {
      throw new Error("Refund request not found");
    }

    // Get payment details separately
    const { data: payment, error: paymentError } = await supabaseClient
      .from("vendor_payments")
      .select("id, stripe_payment_intent_id, amount, user_id, title")
      .eq("id", refundData.payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    const refund = { ...refundData };

    if (action === "approve") {
      // Process Stripe refund if payment was made via Stripe
      if (payment.stripe_payment_intent_id) {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        try {
          const stripeRefund = await stripe.refunds.create({
            payment_intent: payment.stripe_payment_intent_id,
            amount: Math.round(refund.amount * 100), // Convert to cents
            reason: "requested_by_customer",
          });

          console.log("Stripe refund created:", stripeRefund.id);

          // Update payment status
          await supabaseClient
            .from("vendor_payments")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

        } catch (stripeError: any) {
          console.error("Stripe refund error:", stripeError);
          throw new Error(`Stripe refund failed: ${stripeError.message || 'Unknown error'}`);
        }
      }

      // Update refund request
      await supabaseClient
        .from("payment_refunds")
        .update({
          status: "approved",
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", refundId);

      // Send notification to user
      await supabaseClient.functions.invoke("send-payment-notification", {
        body: {
          userId: refund.requested_by,
          type: "refund_approved",
          paymentId: payment.id,
          amount: refund.amount,
          reason: adminNotes || refund.reason,
        },
      });

      // Create in-app notification
      await supabaseClient.from("notifications").insert({
        user_id: refund.requested_by,
        title: "Refund Approved",
        message: `Your refund of $${refund.amount.toFixed(2)} has been approved and will be processed within 5-10 business days.`,
        type: "success",
        category: "payment",
      });

    } else if (action === "reject") {
      // Update refund request
      await supabaseClient
        .from("payment_refunds")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", refundId);

      // Send notification to user
      await supabaseClient.functions.invoke("send-payment-notification", {
        body: {
          userId: refund.requested_by,
          type: "refund_rejected",
          paymentId: payment.id,
          amount: refund.amount,
          reason: adminNotes || "Refund request was not approved",
        },
      });

      // Create in-app notification
      await supabaseClient.from("notifications").insert({
        user_id: refund.requested_by,
        title: "Refund Request Update",
        message: `Your refund request has been reviewed. ${adminNotes || "Please contact support for details."}`,
        type: "info",
        category: "payment",
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: `Refund ${action}d successfully` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    console.error("Error processing refund:", error);
    // Return generic error to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: "Unable to process refund request",
        code: "REFUND_PROCESSING_FAILED"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
