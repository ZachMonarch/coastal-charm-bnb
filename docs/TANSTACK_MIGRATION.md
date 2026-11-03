# TanStack Start Migration — Completion Record

Date: 2026-11-03. Migration from Classic Vite + React Router to TanStack Start v1.

## What changed

| Area | Before | After |
| --- | --- | --- |
| Router | `react-router-dom` route table in `src/App.tsx` (106 declarations) | TanStack file routes in `src/routes/` (105 files + root `notFoundComponent` for unknown URLs) |
| Rendering | Client-only SPA | SSR via TanStack Start (Nitro → Cloudflare Workers) |
| Head/SEO | `react-helmet-async` (client-only) | Root route head shell (`src/routes/__root.tsx`) + per-page client `SEOHead` |
| Imports | `react-router-dom` (119 sites) | `@/lib/router-compat` shim preserving `Link`/`NavLink`/`Navigate`/hooks semantics |
| PWA | Legacy Workbox service worker (`monarch-v2-*` caches) | `public/sw.js` kill-switch: clears legacy caches, unregisters itself |
| UI deps | `react-resizable-panels` v3, DayPicker v8 | v4 `Group/Panel/Separator`, DayPicker v9 `Chevron` |

## Access-control fidelity (verified mechanically)

- 106/106 original route declarations have a destination (105 route files; `*` catch-all → root `notFoundComponent` rendering `NotFound`).
- 65/65 `OptimizedProtectedRoute`-wrapped pages keep the wrapper.
- Every `requiredRole` value matches the original (0 mismatches). Verification scripts: `/tmp/migrate-to-tanstack/verify_routes2.py`, `verify_roles.py`.

## Backend decision: Edge Functions stay on Supabase

All 38 Supabase Edge Functions remain deployed and are called over HTTPS. Every internal-only function's verified secret dependency (`STRIPE_SECRET_KEY`, Resend/email credentials, `SUPABASE_SERVICE_ROLE_KEY`, `GNEWS_API_KEY`) is held only in the external BYO Supabase project; this workspace has no access to those secrets, so migrating the functions would break privileged payment/email/admin operations. `stripe-webhook` keeps its Stripe-registered URL. Evidence per function: `.lovable/migrate-to-tanstack/edge-function-classification.json`.

## SSR correctness fixes

- `SEOHead.tsx` / `EnhancedSEOLayout.tsx`: unguarded `window.location` reads replaced with the canonical `https://monarchpropertymmgt.online` — this removed the "Switched to client rendering … window is not defined" fallback on `/`, `/about`, `/properties`, `/contact`, `/services`.
- `MobileDrawer.tsx`: document-body portal gated behind `useHydrated()`.
- `react-helmet-async` (CommonJS, breaks SSR named imports) replaced by `src/lib/helmet.tsx` shim.

## Verification gates

- `bun run build` — exit 0.
- `bunx tsc --noEmit` — exit 0 (`strict` preserved; only `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` relaxed).
- Playwright probes: `/`, `/about`, `/properties`, `/contact`, `/services`, `/auth`, `/rfq`, `/dashboard`, `/admin`, `/news`, guide blog route, `/vendors` (404 by design), unknown URL (404 page) — all serve with expected status; SSR no longer falls back to client rendering on any probed route.

## Known post-migration notes

- Per-page `SEOHead` metadata applies after hydration (client-side); root static head (title, description, OG defaults, fonts, JSON-LD) is server-rendered.
- Three database security findings (realtime-schema RLS ×2, avatars public-read policy) are tracked separately in the security workstream, outside this migration.
