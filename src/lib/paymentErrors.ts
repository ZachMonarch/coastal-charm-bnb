/**
 * Normalizes payment/edge-function errors into user-safe messages.
 *
 * Stripe-backed edge functions return HTTP 503 with
 * { code: "PAYMENTS_NOT_CONFIGURED" } when STRIPE_SECRET_KEY is not set,
 * so the UI can show a clear message instead of a raw provider error.
 */

export const PAYMENTS_NOT_CONFIGURED_MESSAGE =
  'Online payments are not enabled yet. Please contact support to complete this transaction.';

export function isPaymentsNotConfigured(error: unknown): boolean {
  if (!error) return false;
  const anyErr = error as { message?: string; context?: { status?: number }; status?: number };
  const status = anyErr.context?.status ?? anyErr.status;
  if (status === 503) return true;
  const msg = String(anyErr.message ?? '');
  return msg.includes('PAYMENTS_NOT_CONFIGURED') || msg.includes('Payments are not configured');
}

export function describePaymentError(error: unknown, fallback = 'Payment failed'): string {
  if (isPaymentsNotConfigured(error)) return PAYMENTS_NOT_CONFIGURED_MESSAGE;
  const msg = (error as { message?: string } | null)?.message;
  return msg && msg.trim().length > 0 ? msg : fallback;
}
