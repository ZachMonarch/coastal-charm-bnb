# Changelog

All notable changes to the Monarch Property Management application.

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
