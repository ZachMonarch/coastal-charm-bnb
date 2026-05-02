import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { 
      type, // 'subscription' | 'payment'
      amount,
      currency = 'usd',
      description,
      subscription_tier,
      payment_id,
      metadata = {}
    } = await req.json();
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      success_url: `${req.headers.get("origin")}/vendor/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/vendor/dashboard?payment=cancelled`,
      metadata: {
        user_id: user.id,
        type,
        ...metadata
      }
    };

    if (type === 'subscription') {
      // Subscription mode with 7-day free trial. Card is collected up-front but not charged.
      sessionConfig.mode = 'subscription';
      sessionConfig.payment_method_collection = 'always';
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
        metadata: { user_id: user.id, subscription_tier },
      };
      sessionConfig.line_items = [{
        price_data: {
          currency,
          product_data: {
            name: `${subscription_tier} Subscription`,
            description: `Monthly ${subscription_tier} subscription to Monarch Property Management — 7-day free trial`,
          },
          unit_amount: Math.round(amount * 100),
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }];
      sessionConfig.metadata.subscription_tier = subscription_tier;
    } else {
      // One-time payment mode
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency,
          product_data: {
            name: description || 'Vendor Payment',
            description: description || 'One-time vendor payment',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
      if (payment_id) {
        sessionConfig.metadata.payment_id = payment_id;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Update payment record if it's a vendor payment
    if (type === 'payment' && payment_id) {
      await supabaseClient
        .from('vendor_payments')
        .update({
          stripe_session_id: session.id,
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment_id);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating vendor checkout:', error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to create checkout session",
        code: "CHECKOUT_SESSION_FAILED"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});