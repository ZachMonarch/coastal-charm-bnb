
PLAN

A) Findings Report (Root Causes Confirmed From Code + Screenshots)
1) “Scattered / destroyed” layout + “links feel like pictures / unclickable”
- Root cause: index.html “critical CSS” applies to ALL <nav> elements globally:
  - index.html (inline critical CSS): `nav, header nav { position: fixed; top:0; left:0; right:0; width:100%; z-index:50; ... }`
  - This unintentionally forces every <nav> in the app (mobile drawer nav, dropdown navs, admin navs, etc.) to detach from layout, stack on top of content, and intercept clicks. This matches the screenshots showing stacked bars and overlapping UI.
- Secondary contributor: several “global override” CSS blocks in src/index.css are very broad (lots of `!important` targeting navbar, buttons, spans). They can create layout/visual regressions when combined with the global nav fix.

2) Console warning: cdn.tailwindcss.com
- Root cause: injected by Lovable preview helper script (https://cdn.gpteng.co/gptengineer.js), not by your app code. We cannot fully remove this warning from preview without removing that script (which is not allowed). We can ensure production build does not rely on CDN Tailwind (it doesn’t).

3) Security scan (current status)
- Supabase linter: WARN — Leaked Password Protection Disabled (manual dashboard action required).
- Automated security scan shows ERROR-level items (profiles exposure, audit_logs sensitivity, invoices vendor access model, etc.). Some are true issues (policy scope too broad / role=public) and some are architectural warnings; we will harden what is actionable without weakening RLS.

4) Admin functional gaps reported
- RFQ categories missing (Painting/Flooring/Installations/etc.) due to inconsistent hardcoded category lists across:
  - src/components/AdminRFQSystem.tsx
  - src/pages/admin/RFQEdit.tsx
  - other RFQ creation UI components
- Property select shows only first 100 properties because of `.limit(100)` in src/components/rfq/PropertySelect.tsx.
- Vendor invite lookup uses profiles.role in some flows (example: VendorInviteDialog), which is non-authoritative and violates the “roles must be in user_roles” doctrine.

B) Implementation Plan (Combined: UI stability + security + admin + painting RFQ)

Phase 1 — Emergency UI Stabilization (Stop “scattered UI” + restore clickability)
Goal: Make the UI render correctly and all links clickable, first.

1) Fix index.html critical CSS scope (highest priority)
Files:
- index.html

Actions:
- Replace the global selector `nav, header nav { position: fixed; ... }` with a scoped selector that ONLY targets the public header wrapper, not all navs.
  - Preferred: style the header container only:
    - `[data-monarch-header] { position: fixed; top:0; left:0; right:0; ... }`
    - Remove any `nav { position: fixed; ... }` rules entirely.
- Keep “critical CSS” minimal: only the smallest set for body typography + above-the-fold skeleton styles. Avoid global element rules that fight Tailwind (e.g., global button styling), because Tailwind will handle component styling and this reduces layout thrash.

2) Re-check layout wrapper behavior for public pages
Files:
- src/components/OptimizedLayout.tsx
- src/pages/Index.tsx

Actions:
- Ensure there is only ONE `#main-content` on any route (currently OptimizedLayout and Index both define it). Duplicate IDs can cause focus/skip-link issues.
  - Keep `id="main-content"` in OptimizedLayout (layout-level), remove from Index page’s inner main.

3) Reduce global CSS “layering wars”
Files:
- src/index.css

Actions:
- Audit and tighten the most aggressive selectors that apply `!important` to broad patterns like `[data-monarch-header] nav ...` and general `section span/p` overrides.
- Specifically ensure we do not globally force layout-affecting properties on common tags (`nav`, `button`, `a`, `section`, `main`) beyond safe defaults.
- Keep dropdown styling high z-index, but avoid global pointer-event hacks that can make nested portaled components unreliable.

Acceptance Proof (Phase 1)
- Homepage renders with correct structure: navbar at top, hero below, no duplicated nav blocks.
- All visible links/buttons clickable (Properties, Services dropdown, Join Now, Sign In, hero CTAs).
- Mobile drawer contents stay inside drawer (no “fixed” nav blocks pinned to page).

Phase 2 — Console Errors/Warnings Triage (Actionable only)
Goal: eliminate app-owned errors/warnings; document platform-owned warnings.

1) Remove app-owned console errors/warnings
Files:
- src/** (targeted by observed logs)

Actions:
- Remove/guard any remaining debug console logs in production builds.
- Ensure no runtime errors on mount due to null refs / hooks misuse.

2) Document unfixable preview-only Tailwind CDN warning
- Add a short internal note (and optionally code comment) that this warning comes from the preview helper script and is not used in production.

Acceptance Proof (Phase 2)
- Browser console free of application-generated errors on /, /properties, /auth, /admin (as admin).
- Only remaining known warning is the preview helper CDN Tailwind warning (documented).

Phase 3 — Security Hardening Loop (Supabase linter + security scan)
Goal: decrease security scan findings without weakening RLS; eliminate true exposures.

0) Manual required action (cannot be automated)
- Enable Supabase “Leaked Password Protection” (Block)
  - Supabase Dashboard → Authentication → Settings → Password Security

1) Fix policy role scope (public → authenticated) where appropriate
Rationale: Policies currently use roles={public} on sensitive tables (profiles, invoices, vendor_payment_methods). Even if qual denies anon, scanners flag “publicly readable.” We’ll tighten to authenticated.

DB changes (migration):
- Update SELECT policies to apply to authenticated, not public, for:
  - public.profiles (PII)
  - public.invoices (financial)
  - public.vendor_payment_methods (banking)
  - Any other sensitive table currently using roles public

2) Fix invoices vendor access model (critical)
Problem: Policy currently compares `invoices.vendor_id = auth.uid()`, but schema and other tables suggest vendor identity may be vendor_profiles.id in parts of the app. We must make this consistent and verifiable.

DB changes (migration):
- Confirm what invoices.vendor_id represents:
  Option A (preferred): vendor_id stores vendor_profiles.id
    - Update RLS to check:
      `vendor_id in (select id from vendor_profiles where user_id = auth.uid())`
  Option B: vendor_id stores auth user id
    - Keep `vendor_id = auth.uid()` but ensure all inserts set vendor_id to auth.uid() and tenant_id matches.
- Add/adjust indexes if needed for the RLS subquery pattern (CREATE INDEX IF NOT EXISTS).

3) Reduce exposure of audit logs (without breaking admin tooling)
- Keep strict access (protected_admins only) but:
  - Provide a redacted view (security_invoker=on) used by UI so admins see necessary metadata without IP/user-agent if not needed.
  - Update admin audit UI to query the view (explicit columns, no SELECT *).

4) Enforce “roles only in user_roles” (stop relying on profiles.role)
This is a large but necessary stability/security refactor; do it in controlled steps:
- UI authorization: already uses OptimizedAuthContext hasRole(). Keep that as authoritative.
- Remove/replace role checks that query `profiles.role`:
  - Example: VendorInviteDialog currently does `.eq('role','vendor')` → replace with a server-side RPC that resolves vendor by email via user_roles, returning the vendor user_id and/or vendor_profile id.
- Stop updating profiles.role as part of approval/assignment workflows; keep column for legacy display only (or plan deprecation later).

Acceptance Proof (Phase 3)
- Supabase linter: 0 findings (once leaked password protection enabled).
- Security scan: reduce ERROR count (profiles, invoices, vendor banking access). Any remaining items documented with rationale (e.g., “admin can view banking data by business requirement; access logged; minimized columns”).

Phase 4 — Admin System “No Surprises” Verification + Fixes
Goal: ensure admin can do the required operations reliably and securely.

1) Subscription plan upgrade/downgrade anytime
Files:
- src/components/AdminVendorManagement.tsx / AdminSubscriptionManagement.tsx (where the UI lives)
- supabase/functions/admin-update-vendor-subscription (edge function)

Actions:
- Verify UI allows selecting any plan any time (free ↔ paid).
- Ensure edge function:
  - Validates admin role server-side (user_roles)
  - Validates plan enum whitelist
  - Logs to audit_logs/sent_emails as appropriate
- Ensure UI refreshes state after mutation (react-query invalidate + optimistic UI).

2) Admin can modify projects, add photos/docs, assign to single/multiple vendors
Files:
- src/components/admin/EnhancedAdminProjectManagement.tsx (or equivalent)
- src/components/DocumentManagement.tsx
- src/components/ProjectAssignmentDialog.tsx
- src/components/MultiVendorRFQAssignment.tsx

Actions:
- Verify document uploads write canonical storage path + DB record, then refresh immediately.
- Verify assignment flows:
  - single assignment updates project + creates project_assignments
  - multi-vendor invites create invitation records and vendor notifications
- Ensure “notify vendors” triggers:
  - in-app notifications insert
  - (optional) email via existing Resend edge function if configured

3) Admin can view vendor data/payment methods/documents for payout processing
Actions:
- Ensure admin accesses vendor payment data via secure RPC or edge function (with audit logging), not by broad client-side SELECT on sensitive tables.

Acceptance Proof (Phase 4)
- Admin smoke test checklist:
  - Change vendor plan free → premium → free
  - Upload doc/photo to a project; appears immediately
  - Assign project to vendor A; vendor sees it
  - Assign project to vendors A+B; both notified
  - Admin can view vendor payout/payment methods (through approved path) and process payout workflow

Phase 5 — RFQ System Completeness (Categories, Properties list, and Painting RFQ creation)
Goal: remove RFQ creation friction; add the requested Painting RFQ based on the doc.

1) Unify RFQ categories across the app
Files:
- Create a single source-of-truth constant (e.g., src/lib/rfqCategories.ts) and use it in:
  - src/components/AdminRFQSystem.tsx (project category dropdown)
  - src/pages/admin/RFQEdit.tsx (RFQ category select)
  - src/pages/RequestQuote.tsx (public categories)
  - Any other RFQ/project creation forms
Categories to include (baseline):
- Plumbing, Electrical, HVAC, Painting, Flooring, Carpentry, Roofing, Landscaping, Cleaning, General Contracting, Renovation, Installations, Appliance Repair, Pest Control, Security, Moving, General Maintenance

2) Fix “admin can’t see all properties” in RFQ creation
Files:
- src/components/rfq/PropertySelect.tsx

Actions:
- Replace `.limit(100)` with:
  - server-side search + pagination (explicit select columns; no unbounded queries)
  - UI: search input inside select/combobox; fetch top N matching results
- Keep using safe_property_listings (non-PII).

3) Create the Painting RFQ in the new RFQ system (rfqs + rfq_lots + optional docs)
Inputs (from PAINT_RFQ_DOC_ROUGH.docx):
- Title: “Painting Services — The Broadwin Condominium (MPM/26-PAINT)”
- Address: 1312 East Broad Street, Columbus, OH 43203
- Building: 42 units (27×1BR, 9×2BR, 6×3BR); common areas
- Key constraints: prep cap 25% per unit; owner-furnished paint; duration 6–10 weeks; recurring maintenance term 12 months; emergency on-call
- Payment milestones: 70% mobilization, 30% completion; recurring Net 30; emergency Net 15
- Budget guidance: initial $150k–$280k; recurring/emergency ranges per doc
- Lots: Materials & consumables, Labor & installation, Surface prep, Maintenance program (12 months), Emergency response allowance

DB operations (data, not schema):
- Ensure the property record exists (match by address/title). If missing:
  - Insert a property with safe required fields.
- Insert rfqs row with category “painting” and populate JSONB sections matching RFQEdit schema:
  - document_control, executive_summary, building_details, system_strategy, unit_configuration, technical_specs, commercial_framework, codes_compliance, staffing_requirements, budget_guidance
- Insert rfq_lots entries based on “BID LOTS” table above.
- Optionally upload the docx to the RFQ documents bucket and create rfq_documents row.

Acceptance Proof (Phase 5)
- Admin sees the Painting RFQ in the RFQ list next to HVAC RFQ
- Admin can open details, edit fields, upload documents, and invite/assign vendors
- Vendors can be invited and can submit bids (where permitted by RLS)

Phase 6 — Performance + Accessibility “Scan & Fix” (Mobile/Desktop + Light/Dark)
Goal: meet Lighthouse thresholds and ensure stable UX.

1) Performance
- Validate layout stability (CLS) after removing global fixed nav CSS.
- Ensure hero images remain optimized; verify no render-blocking regressions after critical CSS adjustments.

2) Accessibility
- Run axe in DEV mode (already wired via A11yProvider) and fix:
  - duplicate IDs (main-content)
  - focus order in menus/drawers
  - aria-label consistency for dropdown triggers

VALIDATION (What I will provide after implementation)
1) UI/UX
- Before/after screenshots of / (desktop + mobile)
- Confirm all primary links clickable (navbar dropdowns, hero CTAs, footer links)

2) Console
- Console logs snapshot showing no app errors; note on unavoidable preview helper warning

3) Security
- Supabase linter before/after (expect 0 after manual leaked password protection enable)
- Security scan before/after with delta table + explanations for any remaining non-actionable warnings

4) Admin
- Step-by-step verification checklist with results:
  - subscription change both directions
  - doc upload
  - assignment single/multi
  - vendor notification path
  - RFQ category creation includes Painting/Flooring/Installations

RESULT (Expected Outcomes)
- The app no longer looks “scattered”; layout is stable; navigation and links are fully interactive.
- Security posture improves measurably (RLS scope tightened; invoice/vendor access model consistent; reduced “publicly readable” flags; password protection enabled).
- Admin system supports full operational workflow: subscription changes, project management, documents/photos, vendor assignment (single/multi), vendor communications.
- New “Painting Services — The Broadwin Condominium (MPM/26-PAINT)” RFQ created, visible, editable, and vendor-invitable.

Notes / Constraints
- I will not remove or weaken RLS; any DB changes will be minimal, idempotent, and auditable.
- The “cdn.tailwindcss.com” warning is produced by the preview helper script, not app code; I will ensure your app itself is not using CDN Tailwind.
