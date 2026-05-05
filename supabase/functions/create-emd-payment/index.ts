import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const pre = handleCorsPreflightRequest(req);
  if (pre) return pre;
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: ud, error: ue } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user?.email) throw new Error("Unauthorized");
    const user = ud.user;

    const { rfq_id } = await req.json();
    if (!rfq_id) throw new Error("rfq_id required");

    const { data: rfq, error: rerr } = await supa
      .from("rfqs")
      .select("id,title,requires_emd,emd_amount_cents")
      .eq("id", rfq_id)
      .maybeSingle();
    if (rerr || !rfq) throw new Error("RFQ not found");
    if (!rfq.requires_emd || !rfq.emd_amount_cents || rfq.emd_amount_cents <= 0) {
      throw new Error("This RFQ does not require an EMD");
    }

    // Idempotent: if held already, return success
    const { data: existing } = await supa
      .from("emd_transactions")
      .select("id,status")
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", user.id)
      .maybeSingle();
    if (existing?.status === "held") {
      return new Response(JSON.stringify({ already_held: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id ??
      (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;

    const origin = req.headers.get("origin") || "";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/vendor/rfq/${rfq_id}?emd=success`,
      cancel_url: `${origin}/vendor/rfq/${rfq_id}?emd=cancelled`,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: rfq.emd_amount_cents,
          product_data: {
            name: `EMD — ${rfq.title}`,
            description: "Earnest Money Deposit (refundable on bid loss; forfeited on default)",
          },
        },
        quantity: 1,
      }],
      metadata: { type: "emd", rfq_id, vendor_id: user.id },
    });

    await supa.from("emd_transactions").upsert({
      rfq_id,
      vendor_id: user.id,
      amount_cents: rfq.emd_amount_cents,
      currency: "usd",
      status: "pending",
      stripe_session_id: session.id,
    }, { onConflict: "rfq_id,vendor_id" });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-emd-payment error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
