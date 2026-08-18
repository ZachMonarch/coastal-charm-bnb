# Changelog

All notable changes to the Monarch Property Management application.

## [2.5.0] - 2026-08-18
### Security — privilege escalation and payment integrity
- **Privilege escalation closed at the last trusting policy**: `vendor_bids_insert_vendor` no longer accepts `profiles.role` as proof of vendor status; it now requires a matching row in `public.user_roles`. `profiles.role` / `tenant_id` were already immutable for non-admins via `prevent_profile_privilege_escalation`; a new `BEFORE INSERT` trigger (`trg_prevent_profile_role_insert`) additionally downgrades any privileged role a non-admin tries to self-assign at signup.
- **Bid pricing integrity**: `bid_lines` INSERT/UPDATE now require an active `vendor` role in `user_roles`, not just `vendor_id = auth.uid()`.
- **Checkout price manipulation fixed**: `create-checkout` ignores the client-supplied `amount`. Charges are resolved server-side from `bookings.total_amount`, `vendor_payments.amount` (both scoped to the caller's own record), or a fixed server-side subscription price book (basic 49 / professional 149 / enterprise 399 USD per month). Zero or missing amounts are rejected.
- **`send-invoice` authorization**: the function now loads the invoice from the database and requires the caller to be admin / property_manager or the invoice's own creator/vendor. Recipient, invoice number, amount, currency, due date and line items all come from the `invoices` row — arbitrary recipients and forged figures are no longer possible.
- **`send-sms` is no longer an open relay**: requires a bearer token, resolves the caller via `auth.getUser`, and returns 403 unless the caller holds `admin` or `property_manager`. Message body capped at 1600 characters.

### Dependencies — vulnerable packages upgraded
- `vite` 5.4.10 → **5.4.21** (dev-server `fs.deny` bypass / esbuild advisories).
- `xlsx` 0.18.5 → **0.20.3** from the official SheetJS distribution (npm's registry copy is frozen at the vulnerable 0.18.5: prototype-pollution and ReDoS advisories).
- Verified with `tsgo --noEmit` (app) and `deno check` (edge functions): clean.


## [2.4.0] - 2026-08-14
### Security — database attack surface reduced (measured)
- **Supabase linter: 243 → 102 findings** (verified by running the linter before and after the migration).
- Cleared the last ERROR-level finding: `public.bookings_staff_view` now runs with `security_invoker = true`, so it enforces each caller's own RLS instead of the view owner's. The view already filtered on `auth.uid()`, so behaviour is unchanged.
- Revoked `EXECUTE` from `anon` / `PUBLIC` on every `SECURITY DEFINER` function in `public` and `app`, except a documented allowlist the public website genuinely needs: `get_public_property_listings`, `get_public_property_count`, `get_public_rfq`, `get_public_rfqs`, `check_rate_limit`, `check_auth_rate_limit`, `optimized_rate_limit_check`, `log_security_event`, `log_security_audit`.
- Revoked all client `EXECUTE` on internal trigger functions (they are invoked by the engine, never by clients).
- Pinned `search_path = public` on `public.set_updated_at()` — the last function with a mutable search path (0 remaining).
- Verified afterwards in a headless browser that `/`, `/properties`, `/rfq` and the public RFQ discovery pages load with **no permission or RPC errors**.

### Changed — no more fabricated admin metrics
- `PerformanceMonitoringDashboard` no longer generates synthetic numbers with `Math.random()`. It now reports only measured values: real round-trip latency of a bounded, head-only Supabase count query; real JS heap usage via `performance.memory`; and live probes of Database, Auth, Storage and the `health-check` edge function. Server CPU and concurrent-user counts are shown as **N/A — not instrumented** rather than invented.

### Accessibility — axe-verified, not asserted
Ran axe-core 4.10 headless against `/`, `/properties` and `/contact` before and after. Fixed:
- **Nested `main` landmark** on the homepage: `Index.tsx` rendered its own `<main>` inside the layout's `<main>`. Now a `<div>`.
- **Duplicate `banner` landmark**: `HeroSection` carried `role="banner"` alongside the real `<header>` in `Navbar`. Removed; kept `aria-label="Introduction"` on the section.
- **Content outside a landmark**: the floating WhatsApp link is now wrapped in an `<aside aria-label="Quick contact">`.
- **Contrast, primary buttons**: `--primary` darkened `32 82% 33%` → `32 82% 30%`; white-on-bronze measured 4.48:1 (fail) and now clears 4.5:1.
- **Contrast, navbar wordmark**: `text-primary/70 dark:text-primary/60` on the 12px "MANAGEMENT" line measured 3.05:1 — now full-opacity `text-primary`.
- **Contrast, booking selectors**: the guest/children `SelectItem` rows rendered white text on the off-white card (1.06:1, effectively invisible in the closed trigger). Pinned to `text-foreground`.
- Verified after the fixes: **0 landmark and 0 contrast violations** on all three pages once entry animations settle. The only residual node is `#gdpr_banner` inside Zoho SalesIQ's own iframe markup, which we don't control.
- Note for future audits: PropertyCard buttons report transient contrast failures if axe runs during the card fade-in. They pass once the animation completes — do not "fix" them by hardcoding colors.

### Still blocked on credentials / a decision (unchanged)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` absent → every payment, EMD, subscription, refund and payout flow returns the graceful 503 `PAYMENTS_NOT_CONFIGURED`.
- Twilio secrets absent → `send-sms` inert.
- **Leaked Password Protection is still disabled** — dashboard-only toggle, cannot be set from code.
- Canonical domain unresolved (`.com` vs `.online` vs `coastal-charm-bnb.lovable.app`); sitemap currently uses the lovable domain.


## [2.3.0] - 2026-07-30

### Security (critical)
- **Profile privilege escalation blocked**: added `prevent_profile_privilege_escalation()` BEFORE UPDATE trigger on `public.profiles` — non-admin users can no longer change their own `tenant_id` or `role`. Dropped the duplicate, unrestricted `profiles_update_own` policy and added a `WITH CHECK` to `profiles_unified_update`.
- **RFQ over-broad read fixed**: `app_rfqs_unified_select` (both `public.rfqs` and `app.rfqs`) previously granted SELECT to *any* tenant member. It now additionally requires admin/property_manager role, ownership, an `rfq_invites` row, an active `rfq_access_grants` row, or `status IN ('open','published')`.

### Added
- `supabase/functions/_shared/stripeConfig.ts` — central Stripe configuration guard.
- `src/lib/paymentErrors.ts` — maps 503 / `PAYMENTS_NOT_CONFIGURED` responses to a user-safe message.

### Changed
- All 10 Stripe-dependent edge functions (`create-payment`, `create-checkout`, `create-emd-payment`, `refund-emd`, `process-refund`, `create-payment-method`, `customer-portal`, `check-subscription`, `create-vendor-checkout`, `create-vendor-payment`) now fail fast with HTTP 503 `PAYMENTS_NOT_CONFIGURED` instead of throwing an opaque Stripe "Invalid API Key" error when `STRIPE_SECRET_KEY` is absent.
- `useEMD` surfaces the friendly payment-unavailable message.

### Known gaps (verified 2026-07-30)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are **not configured** — all payment, EMD, subscription, refund and payout flows are non-functional until added.
- Twilio SMS credentials are not configured — `send-sms` is inert.
- Supabase linter: 249 findings (1 ERROR security-definer view, 4 public-bucket-listing, ~240 SECURITY DEFINER execute grants, leaked-password protection disabled).
- `src/lib/cms.ts` remains a stub (5 unimplemented API calls).


## [2.2.0] - 2026-05-03
### Added
- Admin sidebar entry for "Project Access Requests" (`/admin/rfq-access`).
- Footer link "Open Projects" surfacing public RFQ discovery (`/rfq`).
### Changed
- `useBidSubmission` now enforces three pre-submission gates: approved vendor profile (`verification_status`), active or trialing subscription, and an explicit `rfq_access_grants` row for the target RFQ. Drafts remain unrestricted.
### Security
- Hardened RFQ public surface via security_invoker RPCs (`get_public_rfqs`, `get_public_rfq`); SECURITY DEFINER helpers (`has_rfq_access`, `set_updated_at`) locked down with `REVOKE ... FROM PUBLIC`.

## [2.1.3] - 2026-01-24

### Fixed
- **CSS Syntax Errors**: Removed `:is()` and `:has()` selectors that caused "Unexpected button" build warnings
- **PostCSS Configuration**: Updated `postcss.config.cjs` to resolve "missing `from` option" warning
- **Header Button Visibility**: Added `data-auth-button` attribute and CSS rules to preserve white text on Sign In/Join Now buttons across all themes and devices
- **React Warning**: Removed `fetchPriority` prop from `OptimizedLogo` to fix "unrecognized prop" console warning
- **Build Warnings**: Consolidated button text color rules for cleaner CSS output

### Changed
- **Auth Buttons Styling**: Added explicit `[&>a]:text-white` and `!text-white` classes for guaranteed link text visibility inside buttons

---

## [2.1.2] - 2026-01-23

### Fixed
- **Brand Logo**: Implemented official Monarch Property Management Group mountain logo across entire app
- **Header Sign In/Join Now Buttons**: Added visible buttons with high-contrast styling (slate-800 for Sign In, primary for Join Now) on desktop and mobile
- **Logo Standardization**: Updated `OptimizedLogo` component to use official brand logo (`src/assets/brand/monarch-logo.png`)
- **Favicon**: Updated to use official brand logo
- **Auth Pages**: Mobile logo on Auth page and LoginBridge now use `OptimizedLogo`
- **Dashboard Sidebar**: `AppSidebar` and `SidebarLayout` now use standardized `OptimizedLogo`
- **Footer**: Updated to use larger brand logo with "Management Group" text

### Changed
- **vercel.json**: Simplified caching rules using `/images/(.*)` and `/fonts/(.*)` path patterns
- **Header Controls**: Changed icon containers from `bg-card` to `bg-white` for guaranteed visibility

---

## [2.1.1] - 2026-01-23

### Fixed
- **Deployment Blocker**: Removed invalid regex patterns in `vercel.json` (replaced `/(.*)\.(?:jpg|...)$` with simple path matching)
- **Header Sign In Button**: Changed from outline to filled primary button for consistent visibility in all themes
- **Logo Consistency**: Footer now uses `OptimizedLogo` component instead of direct image import

### Changed
- **vercel.json**: Simplified caching rules using `/images/(.*)` and `/fonts/(.*)` path patterns instead of unsupported regex

---

## [2.1.0] - 2026-01-23

### Fixed
- **Build Error**: Resolved Storybook version conflict (downgraded from v10.1.11 to v8.6.14)
- **Unused Imports**: Cleaned up 16 unused lazy-loaded imports in App.tsx that were duplicated in AdminManagementSystem

### Security
- **Profiles RLS**: Added `profiles_tenant_isolated_select` policy for strict tenant isolation
- **Invoices RLS**: Added `invoices_transaction_parties_only` policy restricting access to creator, vendor, and same-tenant admins
- **Financial Reports RLS**: Added `financial_reports_admin_tenant_only` policy with tenant_id check
- **Payment Methods Audit**: Created `admin_get_vendor_payment_methods` RPC function with automatic audit logging

### Infrastructure
- **Cache Headers**: Verified vercel.json configuration for 1-year immutable caching on assets
- **Documentation**: Updated APP-STATUS.md with current status and metrics

### Pending Manual Actions
- Enable Leaked Password Protection in Supabase Dashboard
- Compress hero images for performance optimization

---

## [2.0.0] - 2026-01-20

### Added
- Multi-tenant architecture with `tenant_id` on core tables
- Tenant-aware helper functions (`current_user_tenant_id()`, `is_tenant_admin()`)
- Vendor invoice summary view with PII masking
- Admin profile access audit trigger
- Rate limiting system (`src/lib/rateLimit.ts`)

### Changed
- Consolidated admin components into `AdminManagementSystem`
- Optimized RLS policies (resolved 72 linter warnings)
- Migrated to lazy-loaded admin sub-panels

### Security
- Hardened all SECURITY DEFINER functions with `SET search_path = 'public'`
- Added `vendor_profiles_public` view for privacy-first vendor directory
- Restricted `audit_logs` to super-admins only

---

## [1.5.0] - 2026-01-15

### Added
- PWA support with NetworkFirst caching strategy
- Vercel Analytics (conditional loading for Vercel domains)
- Brand color contrast compliance (WCAG AA 4.64:1)

### Fixed
- Mobile responsiveness with 44px touch targets
- Theme visibility issues in light/dark modes
- Forced reflow optimizations in `useIsMobile` hook

---

## [1.0.0] - 2025-12-01

### Initial Release
- Core property management features
- Vendor onboarding and verification
- RFQ system with bid scoring
- Email notifications via Resend
- Role-based access control
- 77 database tables with RLS

## [2.3.1] - 2026-05-16 — RFQ Access & Invite Fixes

### Fixed
- **RFQ creation blocked for admins without tenant_id**: backfilled `profiles.tenant_id` for admin/property_manager users and made `app.current_tenant()` fall back to the default tenant for privileged roles.
- **Shared RFQ URLs not accessible**: added public SELECT policies on `rfqs` and `rfq_lots` for `status IN ('open','published')`, allowing anonymous and authenticated visitors to view shared RFQ pages.
- **Cannot invite non-site vendors**: `rfq_invites` now accepts email-only invites (`invitee_email`, nullable `vendor_id`, CHECK constraint, unique index). `VendorInviteDialog` no longer rejects unknown emails — it creates an external invite and sends the invitation email instead.
