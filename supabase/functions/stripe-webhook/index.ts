import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.warn("Missing signature or webhook secret in request");
    return new Response(
      JSON.stringify({ error: "Invalid request configuration" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    // Log full error server-side for debugging
    console.error("Webhook signature verification failed:", err);
    // Return generic error to client - don't expose internal details
    return new Response(
      JSON.stringify({ error: "Webhook verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`Processing webhook event: ${event.type}`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);

        // Record transaction
        await supabase.from("transactions").insert({
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: "completed",
          payment_method: paymentIntent.payment_method_types[0],
          metadata: paymentIntent.metadata,
        });

        // Update vendor payment status if applicable
        if (paymentIntent.metadata?.payment_id) {
          await supabase
            .from("vendor_payments")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("id", paymentIntent.metadata.payment_id);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);

        // Record failed transaction
        await supabase.from("transactions").insert({
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: "failed",
          payment_method: paymentIntent.payment_method_types[0],
          metadata: paymentIntent.metadata,
        });

        // Update vendor payment status
        if (paymentIntent.metadata?.payment_id) {
          await supabase
            .from("vendor_payments")
            .update({ status: "failed" })
            .eq("id", paymentIntent.metadata.payment_id);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);

        // Record subscription if applicable
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Update vendor profile with subscription info
          if (session.client_reference_id) {
            await supabase
              .from("vendor_profiles")
              .update({
                subscription_status: "active",
                subscription_expires_at: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq("user_id", session.client_reference_id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", subscription.id);

        // Find and update vendor profile
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ("email" in customer && customer.email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", customer.email)
            .single();

          if (profile) {
            await supabase
              .from("vendor_profiles")
              .update({
                subscription_status: "cancelled",
              })
              .eq("user_id", profile.id);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment succeeded:", invoice.id);

        // Record invoice payment
        await supabase.from("transactions").insert({
          stripe_payment_id: invoice.payment_intent as string,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: "completed",
          metadata: { invoice_id: invoice.id },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Generate unique error ID for correlation
    const errorId = crypto.randomUUID();
    
    // Log full error details server-side only
    console.error(`Webhook processing error [${errorId}]:`, error);
    
    // Log to security_events for monitoring
    try {
      await supabase.from("security_events").insert({
        event_type: "WEBHOOK_PROCESSING_ERROR",
        severity: "high",
        details: {
          error_id: errorId,
          event_type: event.type,
          error_message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    } catch (logError) {
      console.error("Failed to log security event:", logError);
    }
    
    // Return generic error to client - NEVER expose internal details
    return new Response(
      JSON.stringify({ 
        error: "Webhook processing failed",
        errorId: errorId // For support correlation only
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
