import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { CreatePaymentSchema, createValidationErrorResponse } from "../_shared/validation.ts";
import { isPaymentsConfigured, paymentsDisabledResponse } from "../_shared/stripeConfig.ts";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  if (!isPaymentsConfigured()) {
    return paymentsDisabledResponse(corsHeaders);
  }

  // Use service role to bypass RLS after authenticating user
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
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
    
    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Validate input with Zod schema
    const requestBody = await req.json();
    const validationResult = CreatePaymentSchema.safeParse(requestBody);

    if (!validationResult.success) {
      console.warn(`Validation failed for payment request:`, validationResult.error.errors);
      return createValidationErrorResponse(validationResult.error, corsHeaders);
    }

    const { payment_id, paymentId: legacyPaymentId } = validationResult.data;
    const resolvedPaymentId = payment_id || legacyPaymentId;

    console.log("Processing payment for ID:", resolvedPaymentId, "User:", user.id);

    // Get payment details - vendor can pay their own payments
    const { data: payment, error: paymentError } = await supabaseClient
      .from("vendor_payments")
      .select("id, amount, title, vendor_id, status")
      .eq("id", resolvedPaymentId)
      .eq("vendor_id", user.id)
      .eq("status", "pending")
      .single();

    if (paymentError) {
      console.error("Payment lookup error:", paymentError);
      throw new Error("Payment not found or already processed");
    }
    
    if (!payment) {
      throw new Error("Payment not found or already processed");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: payment.title,
              description: "Payment Request"
            },
            unit_amount: Math.round(payment.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/vendor/payments?success=true`,
      cancel_url: `${req.headers.get("origin")}/vendor/payments?cancelled=true`,
      metadata: {
        payment_id: payment.id,
        user_id: user.id
      }
    });

    // Update payment with Stripe session ID
    await supabaseClient
      .from("vendor_payments")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", payment.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: "Request failed", code: "PROCESSING_ERROR" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
