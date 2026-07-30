/**
 * Shared Stripe configuration guard.
 *
 * Payments are only functional when STRIPE_SECRET_KEY is configured as a
 * Supabase secret. Without it, every Stripe call fails with an opaque
 * "Invalid API Key" error. These helpers let each payment function fail
 * fast with a clear, non-leaking 503 instead.
 */

export const PAYMENTS_DISABLED_MESSAGE =
  "Payments are not configured yet. Please contact support.";

export function getStripeKey(): string | null {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  return key && key.trim().length > 0 ? key : null;
}

export function isPaymentsConfigured(): boolean {
  return getStripeKey() !== null;
}

export function paymentsDisabledResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: PAYMENTS_DISABLED_MESSAGE,
      code: "PAYMENTS_NOT_CONFIGURED",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
