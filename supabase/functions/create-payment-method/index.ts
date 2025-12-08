import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { type, cardDetails, bankDetails } = await req.json();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let paymentMethod;

    if (type === "credit_card" && cardDetails) {
      // Create Stripe payment method for credit card
      paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          number: cardDetails.card_number.replace(/\s/g, ""),
          exp_month: parseInt(cardDetails.expiry_month),
          exp_year: parseInt("20" + cardDetails.expiry_year),
          cvc: cardDetails.cvv,
        },
        billing_details: {
          name: cardDetails.name_on_card,
          address: {
            line1: cardDetails.billing_address,
          },
        },
      });

      // Store in database
      const { error: dbError } = await supabaseClient
        .from("vendor_payment_methods")
        .insert({
          vendor_id: user.id,
          stripe_payment_method_id: paymentMethod.id,
          type: "credit_card",
          brand: paymentMethod.card?.brand || null,
          last_four: paymentMethod.card?.last4 || "",
          is_default: false,
        });

      if (dbError) throw dbError;

    } else if (type === "bank_account" && bankDetails) {
      // For bank accounts, store details directly (no Stripe tokenization)
      const { error: dbError } = await supabaseClient
        .from("vendor_payment_methods")
        .insert({
          vendor_id: user.id,
          stripe_payment_method_id: `bank_${Date.now()}`,
          type: "bank_account",
          last_four: bankDetails.account_number.slice(-4),
          is_default: false,
          full_legal_name: bankDetails.full_legal_name,
          bank_name: bankDetails.bank_name,
          bank_address: bankDetails.bank_address,
          owner_address: bankDetails.owner_address,
          account_type: bankDetails.account_type,
          swift_code: bankDetails.swift_code,
          iban: bankDetails.iban,
          wire_instructions: bankDetails.wire_instructions,
        });

      if (dbError) throw dbError;

      paymentMethod = {
        id: `bank_${Date.now()}`,
        last_four: bankDetails.account_number.slice(-4),
      };
    } else {
      throw new Error("Invalid payment method type or missing details");
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        payment_method: {
          id: paymentMethod.id,
          last_four: paymentMethod.card?.last4 || paymentMethod.last_four,
          brand: paymentMethod.card?.brand,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating payment method:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
