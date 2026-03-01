
# CORS Security Hardening -- 24 Edge Functions

## Summary

The only remaining security finding is **wildcard CORS** (`Access-Control-Allow-Origin: *`) in 24 edge functions. A proven secure CORS module already exists at `supabase/functions/_shared/cors.ts` and is successfully used by 12 other functions in production. This plan applies the identical mechanical transformation to all 24 remaining functions.

## What Changes

For each of the 24 functions, three changes are made:

1. **Add import** at the top: `import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';`
2. **Remove** the local `const corsHeaders = { "Access-Control-Allow-Origin": "*", ... };` declaration
3. **Replace** the OPTIONS handler and all response headers to use the shared module

The pattern for each function becomes:

```text
// BEFORE
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  // ... business logic ...
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});

// AFTER
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  // ... business logic unchanged ...
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

## Affected Functions (24)

| # | Function | Lines of Business Logic Changed |
|---|----------|------|
| 1 | admin-update-vendor-subscription | 0 |
| 2 | check-compliance-expiry | 0 |
| 3 | check-subscription | 0 |
| 4 | create-payment-method | 0 |
| 5 | create-vendor-checkout | 0 |
| 6 | create-vendor-payment | 0 |
| 7 | customer-portal | 0 |
| 8 | get-vendor-dashboard-summary | 0 |
| 9 | production-health-monitor | 0 |
| 10 | rate-limit-middleware | 0 |
| 11 | request-subscription-upgrade | 0 |
| 12 | send-bid-confirmation | 0 |
| 13 | send-bid-deadline-approaching | 0 |
| 14 | send-bid-rejection | 0 |
| 15 | send-contract-award | 0 |
| 16 | send-custom-notification | 0 |
| 17 | send-invoice | 0 |
| 18 | send-newsletter | 0 |
| 19 | send-payment-notification | 0 |
| 20 | send-payout-notification | 0 |
| 21 | send-rfq-invitation | 0 |
| 22 | send-rfq-reminders | 0 |
| 23 | send-sms | 0 |
| 24 | system-health-monitor | 0 |

Zero lines of business logic change. Only CORS header generation is affected.

## Safety

- **Proven pattern**: 12 functions already use this exact module in production without issues
- **No behavior change**: All request handling, auth, validation, and business logic remain untouched
- **Allowed origins include**: monarchpropertymmgt.com, www.monarchpropertymmgt.com, *.vercel.app, *.lovable.app, *.lovableproject.com, localhost:3000/5173/8080
- **Reversible**: Each function can be individually reverted by restoring its local corsHeaders declaration

## Deployment

All 24 functions will be deployed together. Edge functions deploy independently, so a failure in one does not affect others.

## Validation

After deployment:
- Security scan finding `edge_wildcard_cors` should resolve
- No CORS errors in browser console when using admin panel, vendor dashboard, and payment flows
- Edge function logs show no new 4xx errors

## Execution Order

All 24 files will be edited in parallel (identical mechanical transformation), then all 24 functions deployed together.

## Remaining Manual Action

**Enable Leaked Password Protection** in Supabase Dashboard:
1. Authentication > Settings > Password Security
2. Enable "Leaked Password Protection"
3. Set mode to "Block"
