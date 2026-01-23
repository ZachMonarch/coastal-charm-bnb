# Changelog

All notable changes to the Monarch Property Management application.

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
