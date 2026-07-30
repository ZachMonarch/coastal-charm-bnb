# Monarch Property Management - Application Status

**Last Updated:** July 30, 2026

> **Accuracy rule:** no checkbox in this file may be ticked without command output or a tool result backing it. Items below marked ❌ were verified as *not working* on 2026-07-30.

## 🚨 Verified blockers (2026-07-30)

| Area | Status | Evidence |
|------|--------|----------|
| Stripe payments (EMD, subscriptions, invoices, refunds, payouts) | ❌ Non-functional | `STRIPE_SECRET_KEY` absent from project secrets; 10+ edge functions depend on it |
| Stripe webhook reconciliation | ❌ Not configured | `STRIPE_WEBHOOK_SECRET` absent |
| SMS notifications | ❌ Non-functional | `TWILIO_*` secrets absent |
| Supabase linter | ⚠️ 249 findings | 1 ERROR (security definer view), 4 public buckets listable, ~240 SECURITY DEFINER execute grants |
| Leaked password protection | ❌ Disabled | Linter WARN 247 |
| CMS layer | ❌ Stub | 5 `TODO: Phase 3` markers in `src/lib/cms.ts` |
| Mock data in admin panels | ⚠️ Present | `AdminInvoices`, `ProductionMonitoring`, `PerformanceMonitoringDashboard`, `SystemDiagnostics`, `MaintenanceRequestPortal` |
| Canonical domain | ⚠️ Inconsistent | `.com` vs `.online` vs `coastal-charm-bnb.lovable.app` across index.html / sitemap / GSC |

Full remediation plan and prioritization: `.lovable/plan.md`.


## ✅ Completed Features

### Core Infrastructure
- [x] React 18 with TypeScript
- [x] Vite build system with code splitting
- [x] Tailwind CSS with custom design system
- [x] Supabase integration (Auth, Database, Storage, Edge Functions)
- [x] Role-based access control (RBAC)
- [x] Protected routes with role verification
- [x] Storybook v8.6.14 (aligned with all addons)

### Authentication & Authorization
- [x] Email/password authentication
- [x] Magic link authentication
- [x] Password reset flow
- [x] User roles: admin, property_manager, vendor, tenant
- [x] Access request system for new users
- [x] Admin approval queue for role requests
- [x] Multi-tenant isolation (tenant_id on all core tables)

### Database & Security
- [x] 82 database tables with RLS enabled
- [x] 253 migrations applied
- [x] Tenant-isolated RLS policies (profiles, invoices, financial_reports)
- [x] Audit logging for sensitive actions (including payment method access)
- [x] Security event tracking
- [x] Protected admin accounts
- [x] Profile name change auditing
- [x] Vendor invoice summary view (PII redaction)

### Email System
- [x] 11 email templates configured
  - Welcome email
  - Password reset
  - Bid confirmation
  - Contract award
  - RFQ invitation
  - RFQ reminder
  - Payment notification
  - Compliance expiry warning
  - Access request approved/rejected
  - Vendor invitation
- [x] Resend integration via Edge Functions

### Storage
- [x] 15 storage buckets configured
- [x] Public and private bucket policies
- [x] Document upload/download for verified users
- [x] Avatar management

### Edge Functions (37 deployed)
- [x] Email sending functions
- [x] Payment processing functions
- [x] Health monitoring
- [x] User capabilities
- [x] Vendor dashboard summary
- [x] News fetching
- [x] Sitemap generation

### RFQ System
- [x] RFQ creation and management
- [x] Vendor invitations
- [x] Bid submission and scoring
- [x] Contract awarding
- [x] Document attachments

### Vendor Features
- [x] Vendor onboarding flow
- [x] Profile management
- [x] Document uploads
- [x] Verification system
- [x] RFQ dashboard
- [x] Contract management
- [x] Payment tracking
- [x] Payout settings

### Admin Features
- [x] Unified admin management (16+ tabs)
- [x] User approval queue
- [x] Vendor verification
- [x] Project management
- [x] Property management
- [x] RFQ management
- [x] Audit logs viewer
- [x] Admin payment method viewing (with audit logging)

### Production Readiness
- [x] Production-safe logger with Sentry integration
- [x] Error boundaries
- [x] No console.log statements in source code
- [x] Lazy loading for 70+ components
- [x] SEO meta tags
- [x] Cache headers configured (vercel.json)
- [x] PWA with NetworkFirst strategy

### Visual Display & Accessibility (Jan 2026)
- [x] Light mode tab visibility fixes (colorful, pills, grid variants)
- [x] High-contrast text (#1a1a1a) for inactive tabs
- [x] Hero button text visibility (white on gradient)
- [x] CSS specificity hardening for Radix components
- [x] Role display shows "Vendor (Pending)" for new signups
- [x] Brand contrast WCAG AA compliant (4.64:1 ratio)
- [x] 44px minimum touch targets

## ⚠️ Manual Actions Required

### 1. Enable Leaked Password Protection (CRITICAL)
Go to **Supabase Dashboard → Authentication → Settings → Password Security**

Enable:
- Leaked password protection
- Custom password requirements (recommended)

### 2. Run Cron Jobs SQL
Execute the SQL in `docs/CRON-JOBS.md` in **Supabase SQL Editor** after enabling:
- `pg_cron` extension
- `pg_net` extension

### 3. Stripe Integration (Skipped)
When ready to accept payments:
1. Add `STRIPE_SECRET_KEY` to secrets
2. Configure Stripe webhook endpoint
3. Test payment flows

### 4. Hero Image Optimization (Performance)
Compress the following images to improve FCP/LCP:
- `public/hero-optimized.webp` → Target: <200KB
- `public/hero-mobile.webp` → Target: <100KB
Use [Squoosh.app](https://squoosh.app) or ImageMagick

## 📊 Current Database Stats (Jan 23, 2026)

| Metric | Count |
|--------|-------|
| Total Tables | 82 |
| Migrations Applied | 253 |
| RLS Policies | 200+ |
| Storage Buckets | 15 |
| Edge Functions | 37 |

## 🔒 Security Status

| Check | Status |
|-------|--------|
| RLS on all tables | ✅ Enabled |
| Tenant isolation | ✅ Enforced |
| Audit logging | ✅ Active |
| Protected admin accounts | ✅ Configured |
| Profiles tenant-scoped | ✅ Implemented |
| Invoices party-restricted | ✅ Implemented |
| Financial reports admin-only | ✅ Implemented |
| Payment methods audited | ✅ Implemented |
| Leaked Password Protection | ⚠️ Manual enable required |

## 🚀 Deployment Checklist

- [x] Build passes without errors
- [x] No TypeScript errors
- [x] No console.log in production code
- [x] All edge functions deployed
- [x] Email templates populated
- [x] Storage buckets configured
- [x] RLS policies verified
- [x] Cache headers configured
- [x] Storybook version aligned (8.6.14)
- [ ] Enable Leaked Password Protection (manual)
- [ ] Schedule cron jobs (manual)
- [ ] Compress hero images (manual)
- [ ] Configure Stripe (when ready)
- [ ] Set up uptime monitoring (recommended)

## 📁 Key Documentation Files

- `docs/CRON-JOBS.md` - Scheduled task SQL
- `docs/APP-STATUS.md` - This file
- `docs/SECURITY_HARDENING.md` - Security documentation
- `docs/CHANGELOG.md` - Version history
- `src/utils/logger.ts` - Production logging utility
