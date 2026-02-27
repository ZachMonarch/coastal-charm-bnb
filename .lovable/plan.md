
# Monarch Property Management -- Stabilization Plan (Additive Only)

## 1. System Risk Map (Concrete Findings)

### RISK 1: Tenant Isolation Gap -- 12 Users with NULL tenant_id
**Severity: HIGH**
12 of 26 users (46%) have `tenant_id = NULL` in their `profiles` table. Since RLS policies use `current_user_tenant_id()` for tenant-scoped access, these users may bypass tenant isolation checks or be silently excluded from results. All 12 are vendors or tenants who signed up after the multi-tenant system was deployed but before `handle_new_user()` was updated to assign tenant_id.

### RISK 2: 7 Stale Pending Approval Requests
**Severity: MEDIUM**
All 7 pending `user_approval_requests` belong to users who **already have the role they requested**. This pollutes the admin approval queue and may cause the Settings page to display "Pending Approval" instead of their actual role (same bug previously fixed for the admin user).

### RISK 3: Leaked Password Protection Disabled
**Severity: MEDIUM**
The only Supabase linter warning. Passwords are not checked against known breach databases. This is a **manual dashboard action** only.

### RISK 4: Rate Limit Function Proliferation
**Severity: LOW**
5 overlapping DB functions exist: `check_rate_limit`, `check_auth_rate_limit`, `enhanced_rate_limit_check`, `enhanced_auth_rate_limit_check`, `optimized_rate_limit_check`. The client code (`src/lib/rateLimit.ts`) uses only `check_rate_limit`. The edge function middleware uses `optimized_rate_limit_check`. No conflicts detected, but the unused functions create confusion.

### RISK 5: 3 Pending Payments Without Stripe References
**Severity: LOW**
3 `vendor_payments` records have `status = 'pending'` with no `stripe_payment_intent_id` or `stripe_session_id`. These are admin-created payment requests awaiting vendor action -- this is expected behavior, not a bug.

### RISK 6: No Observed Auth/Role Drift
**Severity: NONE**
All 26 `profiles.role` values match their `user_roles.role` values. No orphaned profiles without role records. The admin user is correctly in `protected_admins`. No active security events in the last 7 days.

---

## 2. Stabilization Actions (Additive Only)

### Action 2.1: Assign Default tenant_id to 12 Orphaned Users
- **Component**: Database (data update)
- **Intent**: Assign the existing default tenant `00000000-0000-0000-0000-000000000001` to the 12 users with `NULL` tenant_id
- **Why safe**: Additive UPDATE on NULL values only. Does not change any user with an existing tenant_id. All 12 users are vendors/tenants who should belong to the primary tenant.
- **Rollback**: `UPDATE profiles SET tenant_id = NULL WHERE id IN (...list of 12 IDs...)`
- **SQL**:
```sql
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;
```

### Action 2.2: Resolve 7 Stale Pending Approval Requests
- **Component**: Database (data update)
- **Intent**: Mark as `approved` the 7 pending requests where the user already has the requested role
- **Why safe**: Does not change any role. Does not affect users without roles. Only updates status metadata.
- **Rollback**: `UPDATE user_approval_requests SET status = 'pending' WHERE user_id IN (...list...)`
- **SQL**:
```sql
UPDATE user_approval_requests uar
SET status = 'approved',
    reviewed_at = NOW(),
    admin_notes = 'Auto-resolved: User already has the requested role'
WHERE uar.status = 'pending'
AND EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = uar.user_id
  AND ur.role = uar.role_requested
);
```

### Action 2.3: Harden Settings Page Against Future Stale Requests
- **Component**: Frontend (`src/pages/UnifiedSettings.tsx`)
- **Intent**: Add a guard so any user who already has a role (or is admin) never sees "Pending Approval" even if a stale request exists
- **Why safe**: Display-only change. Does not alter any auth logic, role storage, or RLS. Already partially implemented from previous fix; this extends it to cover all roles, not just admin.
- **Rollback**: Revert the single conditional in UnifiedSettings.tsx

### Action 2.4: Add Rate Limit Telemetry Logging
- **Component**: Frontend (`src/lib/rateLimit.ts`)
- **Intent**: Add `console.warn` logging when rate limit DB check fails and falls back to client-side, so failures are observable in production
- **Why safe**: Logging only. No behavior change. Already has `console.warn` for DB errors; this adds structured telemetry for the fallback path.
- **Rollback**: Remove the added console statements

---

## 3. Auth and Role Integrity (Observation)

### Finding 3.1: Role Consistency -- VERIFIED CLEAN
All 26 users have matching `profiles.role` and `user_roles.role`. No drift detected.

### Finding 3.2: Tenant Boundary -- GAP IDENTIFIED
12 users lack tenant_id. Fix planned in Action 2.1 above.

### Finding 3.3: Route Guards -- VERIFIED CORRECT
`OptimizedProtectedRoute` correctly checks `isAuthenticated`, `hasRole`, and `isSubscribed` before rendering protected content. The `hasRole` function in `OptimizedAuthContext` queries `user_roles` (authoritative source). No changes needed.

### Finding 3.4: Protected Admin -- VERIFIED
Admin user `57f850b4...` is in `protected_admins`. Triggers `protect_admin_role` and `protect_admin_profile_role` prevent tampering. No changes needed.

---

## 4. Payments and Stripe Safety (Zero Behavior Change)

### Finding 4.1: Webhook Function -- VERIFIED CORRECT
`stripe-webhook` edge function correctly:
- Verifies signatures before processing
- Uses service_role key server-side only
- Returns generic errors to clients
- Logs failures to `security_events`
- Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`

### Finding 4.2: 3 Pending Payments -- EXPECTED STATE
These are admin-created payment requests awaiting vendor checkout. No Stripe IDs because the vendor hasn't initiated payment yet. This is correct behavior.

### Finding 4.3: No Payment State Anomalies
No payments stuck in inconsistent states (e.g., `completed` without Stripe IDs or vice versa).

### Recommendation 4.4: Add Webhook Event Counter (Future)
Consider adding a simple counter to `system_health` or `security_events` that logs webhook event counts per type per day, for observability. NOT included in this plan -- listed as future enhancement only.

---

## 5. Performance and Reliability

### Finding 5.1: Indexes -- COMPREHENSIVE
All critical tables have appropriate indexes. Specifically:
- `audit_logs`: indexed on user_id, created_at, tenant_id, user+action
- `rate_limits`: indexed on identifier+endpoint
- `vendor_payments`: indexed on vendor_id, status, vendor+status
- `notifications`: indexed on user_id, user+read, user+created
- No missing indexes identified.

### Finding 5.2: Table Sizes -- HEALTHY
- audit_logs: 93 rows / 168 KB
- security_events: 35 rows / 112 KB
- rate_limits: 4 rows / 72 KB
No bloat. No dead tuples above threshold. Autovacuum is handling cleanup.

### Finding 5.3: No Query Rewrites Needed
Current query patterns use explicit column selection and pagination. No `SELECT *` found in RPCs.

---

## 6. Rate Limiting Stabilization

### Finding 6.1: Canonical Path Identified
- **Client app** uses `src/lib/rateLimit.ts` which calls `check_rate_limit` RPC
- **Edge middleware** uses `optimized_rate_limit_check` RPC
- Both paths work independently. No conflicts detected.

### Recommendation 6.1: Do NOT delete unused functions
The functions `enhanced_rate_limit_check`, `enhanced_auth_rate_limit_check`, `check_auth_rate_limit` are not called by any client code but may be referenced by RLS policies or triggers. Deleting them violates the "no removal" constraint. Leave as-is.

### Action 6.1: Document canonical paths (comment in rateLimit.ts)
- Add a comment at the top of `src/lib/rateLimit.ts` documenting which DB function is the canonical one
- **Why safe**: Comment only
- **Rollback**: Remove comment

---

## 7. Admin Guardrails

### Finding 7.1: Admin RPCs Already Audit-Logged
All admin RPCs (`admin_assign_role`, `admin_create_payment`, `admin_send_payout`, `admin_approve_vendor`, etc.) already insert into `audit_logs`. No gaps found.

### Finding 7.2: Protected Admin Enforcement Works
Triggers prevent role removal/change for protected admins at the DB level.

### No Additional Actions Required
The existing guardrail system is comprehensive.

---

## 8. Feature Flags and Rollback

### This Plan Does Not Require Feature Flags
All proposed changes are:
- Data corrections (Actions 2.1, 2.2) -- reversible via SQL
- A single UI guard (Action 2.3) -- reversible by reverting one file
- A logging addition (Action 2.4) -- reversible by removing log statements

### Deploy Order
1. Action 2.1 (tenant_id fix) -- SQL migration
2. Action 2.2 (stale approvals) -- SQL migration (can be same migration)
3. Action 2.3 (Settings UI guard) -- frontend code change
4. Action 2.4 (rate limit telemetry) -- frontend code change

Actions 2.1 and 2.2 can be combined into a single migration. Actions 2.3 and 2.4 are independent frontend changes.

---

## 9. Validation Checklist

### Pre-Deploy Checks
- [ ] Verify all 12 NULL-tenant users are vendors/tenants (confirmed above)
- [ ] Verify all 7 stale requests match existing roles (confirmed above)
- [ ] Verify no active Stripe checkout sessions reference affected users

### Post-Deploy Checks
- [ ] `SELECT COUNT(*) FROM profiles WHERE tenant_id IS NULL` returns 0
- [ ] `SELECT COUNT(*) FROM user_approval_requests WHERE status = 'pending'` returns 0
- [ ] Admin Settings page shows "Admin" role (not "Pending Approval")
- [ ] Vendor users' Settings pages show correct role
- [ ] Admin approval queue is empty (no false pending items)
- [ ] Login/signup still works (rate limiting not broken)
- [ ] No new entries in `security_events` with severity = 'high'

### Metrics to Watch (48 hours post-deploy)
- Auth error rate (should remain at 0)
- `security_events` count (should not spike)
- Admin approval queue (should remain clean)

### Abort Conditions
- If any user loses access after tenant_id assignment: rollback Action 2.1
- If approval queue shows wrong statuses: rollback Action 2.2
- If Settings page breaks for any role: revert Action 2.3

---

## Manual Action Required (Outside This Plan)

**Enable Leaked Password Protection** in Supabase Dashboard:
1. Authentication -> Settings -> Password Security
2. Enable "Leaked Password Protection"
3. Set mode to "Block"

This cannot be automated and remains the only open linter warning.
