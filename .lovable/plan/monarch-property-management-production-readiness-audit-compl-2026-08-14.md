# Monarch Property Management — Production Readiness Audit & Completion Plan

## 1. Verified current state (from this session's reads)

**Confirmed working / built**
- 150+ routes registered in `App.tsx`, including public site, RFQ discovery + public share (`/rfq/:id`), full vendor portal (30+ routes), vendor onboarding wizard (6 steps), and admin suite (RFQ create/edit/detail, EMD ledger, bid analysis, vendor detail, payouts, work orders, team, SalesIQ admin).
- 37 edge functions present; email stack via Resend; news via GNews.
- Test scaffolding exists: 4 unit test files + 6 Playwright e2e specs (RFQ flow, public share, admin nav, admin security, mobile a11y).
- SEO assets in place: `sitemap.xml`, `robots.txt`, `llms.txt`, OG/Twitter tags, guide page + JSON-LD.

**Confirmed blockers (verified, not assumed)**
1. **Payments are dead.** `secrets--fetch_secrets` returns only `GNEWS_API_KEY`, `GOOGLE_SEARCH_CONSOLE_API_KEY`, `LOVABLE_API_KEY`, `RESEND_API_KEY`. **No `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.** 12 edge functions read `STRIPE_SECRET_KEY` and will all fail at runtime: `create-payment`, `create-checkout`, `create-emd-payment`, `refund-emd`, `process-refund`, `create-payment-method`, `customer-portal`, `check-subscription`, `create-vendor-checkout`, `create-vendor-payment`, `stripe-webhook`, `system-health-monitor`. So EMD gating, vendor subscriptions, invoices, refunds and payouts are UI-only today.
2. **SMS is dead.** `send-sms` requires `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` — none configured.
3. **Supabase linter: 247 findings.** 1 ERROR (Security Definer View), plus 4 public-bucket-listing warnings, mutable `search_path` functions, ~240 "SECURITY DEFINER function executable by anon/authenticated" warnings, and **Leaked Password Protection still disabled** (documented as pending since Jan 2025).
4. **CMS layer is a stub.** `src/lib/cms.ts` has 5 `TODO: Phase 3 – implement actual CMS API call` sites returning nothing — any page relying on it renders empty.
5. **Mock/placeholder data still shipping** in ~19 components including `AdminInvoices`, `PerformanceMonitoringDashboard`, `ProductionMonitoring`, `SystemDiagnostics`, `MaintenanceRequestPortal`, `AdminPropertyManagement`.
6. **Domain inconsistency.** Memory/knowledge says canonical is `monarchpropertymmgt.online`, custom instructions say `.com`, published URL is `coastal-charm-bnb.lovable.app`, sitemap was last pointed at the lovable domain. GSC verification and canonical tags cannot all be correct simultaneously.

---

## 2. Gap register (by severity)

### P0 — blocks real business use
| # | Gap | Impact |
|---|---|---|
| A | Stripe secrets absent | No revenue: no EMD, no vendor subscriptions, no invoice payment, no refunds |
| B | Stripe webhook unverified/unregistered | Payment state never reconciles even once keys exist |
| C | Leaked-password protection off | Credential-stuffing exposure on an app holding financial + PII data |
| D | 1 ERROR-level Security Definer View | Potential RLS bypass on a view |
| E | Canonical domain not settled | SEO cannibalization, broken OG previews, GSC verification stuck |

### P1 — degrades trust / usability
| # | Gap | Impact |
|---|---|---|
| F | 4 public buckets allow full listing | Anyone can enumerate uploaded files |
| G | ~240 SECURITY DEFINER functions executable by anon/authenticated | Large privileged attack surface; needs triage + EXECUTE revokes |
| H | Mock data in admin dashboards | Operators make decisions on fake numbers |
| I | CMS stub | Content pages can't be edited without a deploy |
| J | No SMS provider | Notification flows silently no-op |
| K | Test suite is thin and unrun in CI | Regressions ship unnoticed |

### P2 — polish / scale
| # | Gap |
|---|---|
| L | LCP / hero image weight (hero webp targets never met: <200KB desktop, <100KB mobile) |
| M | Cron jobs from `docs/CRON-JOBS.md` never scheduled (compliance expiry, RFQ reminders, retention cleanup) |
| N | No uptime monitoring / error-rate alerting wired to a human |
| O | Accessibility: contrast + heading-order fixes partially applied, never re-audited end-to-end |
| P | Docs drift: `APP-STATUS.md` claims "82 tables / 253 migrations / deployment green" — stale |

---

## 3. Recommended completion sequence

**Phase 1 — Make money possible (1 work session)**
1. Add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` as secrets (test keys first).
2. Register the webhook endpoint at the `stripe-webhook` function URL; subscribe to `payment_intent.succeeded`, `charge.refunded`, `checkout.session.completed`, `customer.subscription.*`.
3. Add a graceful degradation guard: every Stripe-dependent function returns a clear "payments not configured" 503 and every payment button disables itself instead of throwing.
4. End-to-end test with Stripe test cards: EMD pay → RFQ unlock → refund/forfeit; vendor subscription checkout → `check-subscription` → customer portal.

**Phase 2 — Security floor (must precede public launch)**
5. Enable Leaked Password Protection in Supabase Auth (2-minute dashboard toggle, still open after 18 months).
6. Resolve the ERROR-level Security Definer View — convert to `security_invoker = true` or document + ignore with justification.
7. Lock the 4 public buckets: remove broad `SELECT` on `storage.objects`, move to signed URLs for anything non-marketing.
8. Triage the 240 SECURITY DEFINER function warnings in **groups**, not one by one: bucket them into (a) intentionally public RPCs, (b) authenticated-only, (c) internal-only → `REVOKE EXECUTE FROM anon, authenticated`. Set `SET search_path = public` on every function missing it in the same migration.
9. Re-run linter; require the count to go **down** at every step, never up.

**Phase 3 — Truth in the UI**
10. Replace mock data in `AdminInvoices`, `ProductionMonitoring`, `PerformanceMonitoringDashboard`, `SystemDiagnostics`, `MaintenanceRequestPortal` with live queries + skeletons, or hide those panels behind a "Coming soon" flag. Fake admin numbers are worse than no numbers.
11. Decide CMS: either implement a Supabase-backed `content_pages` table (recommended — no third-party dependency) or delete `src/lib/cms.ts` and its callers.
12. Decide SMS: add Twilio secrets, or remove the SMS path so notifications don't silently fail.

**Phase 4 — Domain, SEO, performance**
13. Pick **one** canonical domain and enforce it everywhere: `index.html` canonical + og:url, `sitemap.xml`, `robots.txt`, Supabase Auth Site URL + redirect allowlist, edge-function CORS allowlist, GSC property.
14. Compress hero images to target, verify LCP < 2.5s on throttled mobile.
15. Schedule the cron jobs from `docs/CRON-JOBS.md` (pg_cron + pg_net).
16. Full axe/Lighthouse pass on the 10 highest-traffic routes; fix contrast and heading order for real, then re-scan.

**Phase 5 — Operability**
17. Wire the existing Playwright specs into CI as a merge gate; add specs for the payment happy-path and the admin approval queue.
18. Turn on uptime monitoring + Sentry alert routing to an actual inbox.
19. Rewrite `docs/APP-STATUS.md` and `CHANGELOG.md` from measured reality (query the DB for table/migration counts) rather than aspiration.

---

## 4. Devil's advocate — the uncomfortable read

- **The app is a demo, not a business, until Stripe is live.** Every "completed" payment module in the docs is UI over a function that throws on line one. This is the single largest gap between claimed and actual status. Treat all payment features as 0% done, not 100%.
- **247 linter findings contradicts the "Security Score ≥ 90 / 0 warnings" goal state in your own doctrine.** Prior sessions marked findings "fixed" while the linter count stayed in the hundreds. Recommendation: stop trusting the finding-management UI as evidence and adopt one hard metric — *raw linter count, before and after, in every change summary*.
- **Documentation has become fiction.** `APP-STATUS.md` says "Deployment green, build passes, all edge functions deployed" while three integrations have no credentials. Stale-confident docs cause worse decisions than missing docs. Add a rule: no checkbox is ticked without a command output pasted next to it.
- **Scope is far past what one operator can run.** 150+ routes, 82 tables, 37 functions, 4 roles. For a first real customer you need maybe 20 routes working flawlessly. Recommendation: define a **launch surface** (public marketing + property browse + contact/quote + admin RFQ + vendor bid) and *feature-flag everything else off* rather than shipping a wide, half-verified surface.
- **Multi-tenancy is asserted, not proven.** Tenant isolation is enforced via `tenant_id` + RLS, and prior fixes added an admin *fallback to a default tenant* — that fallback is exactly the kind of shortcut that leaks data across tenants under load. Before onboarding a second business, run an explicit adversarial test: two tenants, two admins, attempt every read/write cross-tenant, assert 0 rows.
- **No load or cost testing.** Egress policy is documented but unenforced; unbounded queries plus a public RFQ portal is a plausible surprise-bill vector. Add pagination assertions to CI.

**My recommendation:** do not chase all 247 warnings first. Order is Phase 1 (revenue) → Phase 2 (security floor: items 5–7 only) → Phase 3 (kill fake data) → shrink the launch surface → then grind the linter down in the background.

---

## 5. Technical notes

- Stripe secrets go through the secrets tool, never `.env` or client code. `stripe-webhook` must verify signatures with `STRIPE_WEBHOOK_SECRET` and be exempt from JWT verification in `supabase/config.toml`.
- The SECURITY DEFINER remediation must be a small number of grouped, idempotent migrations (`REVOKE ... IF EXISTS` patterns, `ALTER FUNCTION ... SET search_path = public`) — not 240 individual statements.
- Bucket hardening: prefer `createSignedUrl` in `useOptimizedVendorUpload` / `vendorFileUpload.ts` over public URLs for `vendor_docs` and profile photos.
- Domain change touches: `index.html`, `public/sitemap.xml`, `public/robots.txt`, `src/hooks/useCanonicalUrl.ts`, `src/lib/sitemap.ts`, `supabase/functions/_shared` CORS allowlist, Supabase Auth URL config.

---

## 6. What I need from you before building

1. Do you have a Stripe account ready, and should I wire **test** keys first? (Without keys, Phase 1 stops at the graceful-degradation guard.)
2. Canonical domain — `.com`, `.online`, or the lovable subdomain?
3. Mock-data panels: replace with live data, or hide behind a flag for launch?
4. CMS and SMS: implement, or remove?
