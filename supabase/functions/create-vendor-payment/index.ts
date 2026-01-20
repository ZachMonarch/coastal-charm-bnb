import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const PaymentRequestSchema = z.object({
  paymentId: z.string().uuid()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Validate input
    const requestBody = await req.json();
    const validationResult = PaymentRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { paymentId } = validationResult.data;
    
    // Get payment details - explicit columns only (security best practice)
    const { data: payment, error: paymentError } = await supabaseClient
      .from('vendor_payments')
      .select('id, vendor_id, amount, status, payment_type, title, description')
      .eq('id', paymentId)
      .eq('vendor_id', user.id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found or access denied");
    }

    if (payment.status !== 'pending') {
      throw new Error("Payment is not in pending status");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe checkout session for vendor payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: payment.title,
              description: payment.description || undefined,
            },
            unit_amount: Math.round(Number(payment.amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/vendor/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/vendor/dashboard?payment=cancelled`,
      metadata: {
        payment_id: paymentId,
        vendor_id: user.id,
        payment_type: payment.payment_type,
      },
    });

    // Update payment with stripe session id
    await supabaseClient
      .from('vendor_payments')
      .update({
        stripe_session_id: session.id,
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    console.error('Error creating vendor payment:', error);
    
    // Return generic error (security: don't leak details)
    return new Response(
      JSON.stringify({ 
        error: "Unable to process payment",
        code: "PAYMENT_PROCESSING_FAILED"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});