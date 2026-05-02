# Plan: Public RFQ Discovery + Access Workflow + Trial + Hardening

## Findings

- **No public RFQ routes exist** — `/admin/rfq/*` and `/vendor/rfq/*` only. Direct shared RFQ links 404 for anonymous users.
- **Access requests** today (`user_approval_requests`) are role-level, not per-project. There is no per-RFQ access grant model.
- **Subscriptions** (`useSubscription`, `create-vendor-checkout`) have no Stripe trial period configured. Bid eligibility checks `isSubscribed('basic')` only, not "approved vendor + paid + active".
- **RLS on `rfqs` / `rfq_properties`** allows any authenticated vendor to read open RFQs. There is no gate that requires admin-granted per-project access.
- **No RFQ audit log** beyond global `security_events`. No status/summary surface that lists linked properties + selected services.
- **RFQEdit save** swallows partial failures — junction upserts don't surface row-level errors.
- **No automated tests** for property creation or `rfq_properties` upsert paths.

---

## Architecture

```text
Anonymous visit /rfq/:id  ──▶ PublicRFQView (masked: title, city/state, deadline, category)
                                │   "Sign up to request access"
                                ▼
Sign up ──▶ Vendor onboarding ──▶ RFI form (per-RFQ access request)
                                                   │
                                                   ▼
                                        Admin reviews in /admin/access
                                                   │
                          approves ──▶ rfq_access_grants row created
                                                   ▼
                          Vendor sees full RFQ + can Bid (if paid plan + approved)
```

---

## Implementation Steps

### 1. Database migration

```sql
-- Per-RFQ access grants
CREATE TABLE public.rfq_access_requests (
  id uuid PK DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  company_name text, phone text, message text,
  rfi_answers jsonb DEFAULT '{}',
  status text CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  admin_notes text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rfq_id, user_id)
);

CREATE TABLE public.rfq_access_grants (
  id uuid PK DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid, granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(rfq_id, user_id)
);

-- RFQ audit log (admin/PM read; insert by triggers)
CREATE TABLE public.rfq_audit_log (
  id uuid PK DEFAULT gen_random_uuid(),
  rfq_id uuid, entity_type text, entity_id text,
  action text, actor_id uuid, before jsonb, after jsonb,
  created_at timestamptz DEFAULT now()
);

-- Public-safe masked view of RFQs (security_invoker=on)
CREATE VIEW public.rfqs_public_masked AS
  SELECT id, title, status, deadline, category,
         substring(description, 1, 200) AS preview,
         created_at
  FROM rfqs WHERE status IN ('open','draft');

-- Helper function: vendor_has_rfq_access
CREATE FUNCTION has_rfq_access(_rfq uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT is_admin_user(_user)
      OR EXISTS (SELECT 1 FROM rfq_access_grants
                 WHERE rfq_id=_rfq AND user_id=_user AND revoked_at IS NULL);
$$;

-- Tighten RLS: rfqs.SELECT for vendors requires has_rfq_access(id, auth.uid())
-- rfq_properties.SELECT requires has_rfq_access(rfq_id, auth.uid())
-- rfq_access_requests: insert by self; select self + admin; update admin only
-- rfq_access_grants: select self + admin; insert/update admin only
-- Audit triggers on rfqs, rfq_properties, rfq_access_grants → rfq_audit_log
```

### 2. Public-facing routes (no auth required)

- `src/pages/public/RFQDiscovery.tsx` → `/projects` and `/rfq` — grid of masked open RFQs.
- `src/pages/public/PublicRFQView.tsx` → `/rfq/:id` — shows title, location (city/state), deadline, category, blurred preview. CTA: "Sign up to request access" or "Request access" (if logged in).
- Add to `App.tsx` outside the `OptimizedProtectedRoute` guards.

### 3. Per-RFQ Access Request flow

- `src/components/rfq/RequestRFQAccessDialog.tsx` — RFI form (company, phone, services interest, message, basic qualifications). Inserts to `rfq_access_requests`.
- `src/pages/admin/AccessRequestsPage.tsx` (extend existing) — new tab "Project Access Requests" with approve/reject. Approve creates `rfq_access_grants` row.

### 4. 7-day Stripe trial

- Update `supabase/functions/create-vendor-checkout/index.ts`: add `subscription_data: { trial_period_days: 7 }`.
- Checkout UI: collect card details up-front; show "No charge for 7 days" badge.
- `useSubscription`: surface `trial_end` and `trialing` status.
- Bid gating: require `subscribed === true` (Stripe returns true during trial) AND vendor `is_approved` AND `vendor_profiles.status='approved'`.

### 5. Hardened RLS + capabilities

- Tighten `rfqs` SELECT policy: admin OR PM OR `has_rfq_access(id, auth.uid())`.
- Tighten `rfq_properties`, `rfq_documents` SELECT to `has_rfq_access(rfq_id, auth.uid())`.
- Public discovery uses `rfqs_public_masked` view (no PII, no documents, no budget).
- Bid submission: server-side check in `useBidSubmission` + edge function asserting grant + paid + approved.

### 6. RFQ Status / Summary tab

- Add "Status & Summary" tab in `RFQEdit.tsx` and read-only equivalent in `RFQDetail.tsx`:
  - Linked properties with assigned services per property.
  - Counts: invited vendors, access requests (pending/approved), bids received, days to deadline.
  - Recent audit events from `rfq_audit_log`.

### 7. Improved RFQEdit error handling

- Refactor `saveLinkedProperties` to upsert per-row, collect failures, surface a toast list ("Property X failed: <reason>") instead of swallowing.
- Use Supabase `onConflict: 'rfq_id,property_id'` and return `{ error }` per row.
- Wrap entire save in transaction-like sequence; rollback indicator on partial failure.

### 8. Audit log triggers

- Triggers on `rfqs`, `rfq_properties`, `rfq_access_grants` → write to `rfq_audit_log` with `auth.uid()` as actor, before/after JSONB.
- Admin UI: `src/components/rfq/RFQAuditTimeline.tsx` rendered in Status tab.

### 9. Automated tests

- `src/test/properties.test.ts` (vitest) — mock supabase, assert `properties` insert omits id and succeeds.
- `src/test/rfqProperties.test.ts` — assert upsert path handles insert + update + delete correctly.
- `tests/e2e/public-rfq-flow.spec.ts` (Playwright) — anon visits `/rfq/:id` sees masked view; signup → request access → admin approves → vendor sees full RFQ.

---

## Files Touched

**New**
- `supabase/migrations/<ts>_public_rfq_access_audit.sql`
- `src/pages/public/RFQDiscovery.tsx`, `src/pages/public/PublicRFQView.tsx`
- `src/components/rfq/RequestRFQAccessDialog.tsx`
- `src/components/rfq/RFQAuditTimeline.tsx`
- `src/components/rfq/RFQStatusSummary.tsx`
- `src/hooks/useRFQAccess.ts`, `src/hooks/useRFQAuditLog.ts`
- `src/test/properties.test.ts`, `src/test/rfqProperties.test.ts`
- `tests/e2e/public-rfq-flow.spec.ts`

**Edited**
- `src/App.tsx` — add public routes
- `src/pages/admin/RFQEdit.tsx` — Status tab, granular save errors
- `src/pages/admin/RFQDetail.tsx` — Status summary
- `src/pages/admin/AccessRequestsPage.tsx` — Project access tab
- `supabase/functions/create-vendor-checkout/index.ts` — `trial_period_days: 7`
- `src/hooks/useSubscription.ts` — expose `trialEnd`, `trialing`
- `src/hooks/useBidSubmission.ts` — gate on grant + paid + approved
- `src/components/SubscriptionPlans.tsx` — "7-day free trial" copy

## Validation
- Anonymous: `/rfq/:id` renders masked view, no PII, sign-up CTA.
- Authenticated vendor without grant: still masked + "Request Access" form.
- After admin approval: full RFQ + documents + ability to bid (if paid/approved).
- RLS: direct DB query as anon for `rfqs.*` returns nothing; only `rfqs_public_masked`.
- Trial: Stripe checkout shows trial; subscription `trialing` for 7 days; bidding allowed.
- Audit: editing RFQ writes row to `rfq_audit_log`; visible in Status tab.
- Tests: property + rfq_properties unit tests pass; e2e public flow passes.
