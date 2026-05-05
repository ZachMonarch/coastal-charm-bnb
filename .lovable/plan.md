# Plan: Complete Admin & Vendor RFQ System (8 modules)

## Scope Confirmed
All 8 modules; EMD = Stripe charge + manual refund/forfeit.

## Database Migrations (single migration)

1. **`emd_transactions`** — `id, rfq_id, vendor_id, amount_cents, currency, status (pending|held|refunded|forfeited), stripe_payment_intent_id, stripe_charge_id, stripe_refund_id, paid_at, released_at, forfeited_at, notes, created_at`. RLS: vendor sees own; admin sees all.
2. **`rfq_scoring_weights`** — `rfq_id PK, price_weight, delivery_weight, compliance_weight, experience_weight, quality_weight` (numeric 0–100, sum validated by trigger). RLS: admin write, vendor read for their RFQ.
3. **`bid_shortlist`** — `id, rfq_id, vendor_id, shortlisted_by, shortlisted_at, notes` UNIQUE(rfq_id, vendor_id). Admin-only RLS.
4. **`vendor_profiles.is_blacklisted boolean default false`** + `blacklist_reason text` + `blacklisted_at`. Update RLS to exclude blacklisted from public/vendor discovery RPCs.
5. **`vendor_activity_events`** view (UNION of `rfq_audit_log`, `bid_lines`, `contracts`, `emd_transactions` filtered per vendor). `security_invoker = true`.
6. **RPCs:**
   - `get_top_vendors(limit int)` — aggregate awarded contracts + avg score → leaderboard.
   - `get_admin_vendor_detail(vendor_id uuid)` — score breakdown + bid history (admin only).
   - `compute_bid_score(bid_id uuid)` — weighted score using `rfq_scoring_weights`.
   - `get_cross_rfq_bids(filters jsonb)` — admin cross-RFQ comparison.
   - `forfeit_emd(emd_id uuid)` / `refund_emd(emd_id uuid)` — admin actions, audit-logged.

## Edge Functions

1. **`create-emd-payment`** — Stripe Checkout Session for EMD amount, metadata `{rfq_id, vendor_id, type:'emd'}`. Charge mode (not subscription).
2. **`refund-emd`** — admin-only; calls Stripe refund, updates `emd_transactions.status='refunded'`.
3. **`stripe-webhook`** — extend existing to handle `checkout.session.completed` for EMD → insert/update `emd_transactions` to `held`.

## Frontend (10 files)

1. **`/admin/vendors/:id`** — `AdminVendorDetail.tsx`: score breakdown, bid history table, action panel (approve/reject/blacklist/unblacklist).
2. **`/admin/bids`** — `CrossRFQBidAnalysis.tsx`: filterable table across all RFQs, shortlist toggle, award action.
3. **`/admin/emd`** — `AdminEMDLedger.tsx`: transaction table with refund/forfeit buttons.
4. **`RFQDetail` refactor** — convert `ComprehensiveRFQDetail.tsx` collapsibles → 4 `Tabs`: Scope · Bids (ranked w/ weighted score) · Scoring · Documents. New `RFQScoringWeightsEditor.tsx` inside Scoring tab.
5. **`AdminDashboardContent`** additions — `ActiveRFQsWidget`, `PendingApprovalsWidget`, `TopVendorLeaderboard`.
6. **`VendorRFQDetail`** — add `EMDPayToUnlockGate` wrapping bid section; check `emd_transactions.status='held'` before revealing full scope/bid form.
7. **`VendorDashboardComplete`** — add `VendorActivityFeed` + `VendorPerformanceCard`.
8. **`EnhancedVendorSystem`** — add Blacklist button to vendor card; reflect `is_blacklisted` badge.
9. **Hooks**: `useEMD.ts`, `useScoringWeights.ts`, `useBidShortlist.ts`, `useTopVendors.ts`, `useVendorActivity.ts`.
10. **`useBidSubmission`** — add EMD-paid gate (only when RFQ has EMD requirement set).

## Security
- All new tables RLS-enabled; admin checks via `has_role(auth.uid(),'admin')`.
- EMD refund/forfeit RPCs are `security definer` + audit log entry.
- Stripe webhook validates signature; idempotent on `stripe_payment_intent_id`.
- `vendor_activity_events` view uses `security_invoker=true`.

## Validation
- Vitest: scoring math, EMD state machine transitions.
- Manual: vendor pays EMD → bid form unlocks; admin refunds → vendor notified; blacklist hides vendor from invites.
- Supabase linter: 0 new warnings.
- `docs/CHANGELOG.md` v2.3.0 entry.

## Files Touched (~22)
New: 1 migration, 3 edge functions, 10 components/pages, 5 hooks, 1 test file. Edited: `App.tsx` (3 routes), `AppSidebar.tsx`, `ComprehensiveRFQDetail.tsx`, `AdminDashboardContent.tsx`, `VendorRFQDetail.tsx`, `VendorDashboardComplete.tsx`, `EnhancedVendorSystem.tsx`, `useBidSubmission.ts`, `stripe-webhook/index.ts`.

## Out of Scope
- Stripe Connect / direct vendor payouts beyond existing.
- Cross-tenant analytics.
- Mobile-native EMD flows (web Stripe Checkout only).
