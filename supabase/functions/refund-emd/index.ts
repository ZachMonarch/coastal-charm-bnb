import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { isPaymentsConfigured, paymentsDisabledResponse } from "../_shared/stripeConfig.ts";

serve(async (req) => {
  const pre = handleCorsPreflightRequest(req);
  if (pre) return pre;
  const corsHeaders = getCorsHeaders(req);
  if (!isPaymentsConfigured()) {
    return paymentsDisabledResponse(corsHeaders);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: ud, error: ue } = await supa.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !ud.user) throw new Error("Unauthorized");

    // Verify admin
    const { data: roles } = await supa
      .from("user_roles")
      .select("role")
      .eq("user_id", ud.user.id);
    if (!roles?.some((r: any) => r.role === "admin")) throw new Error("Forbidden");

    const { emd_id, notes } = await req.json();
    if (!emd_id) throw new Error("emd_id required");

    const { data: emd, error: ee } = await supa
      .from("emd_transactions")
      .select("*")
      .eq("id", emd_id)
      .maybeSingle();
    if (ee || !emd) throw new Error("EMD not found");
    if (emd.status !== "held") throw new Error(`EMD is ${emd.status}, cannot refund`);
    if (!emd.stripe_payment_intent_id) throw new Error("No payment intent on record");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const refund = await stripe.refunds.create({
      payment_intent: emd.stripe_payment_intent_id,
      reason: "requested_by_customer",
    });

    const { data: updated, error: uerr } = await supa.rpc("refund_emd", {
      _emd_id: emd_id,
      _refund_id: refund.id,
      _notes: notes ?? null,
    });
    if (uerr) throw uerr;

    return new Response(JSON.stringify({ ok: true, refund_id: refund.id, emd: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refund-emd error", e);
    return new Response(JSON.stringify({ error: "Request failed", code: "PROCESSING_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
