

# Plan: RFQ Fixes + Security Hardening + Session Stability

## Findings

### RFQ Issues
1. **HVAC-only template**: Default category is hardcoded to `'hvac'`, all placeholders reference HVAC (e.g., "HVAC Technical, BOQ...", "Dedicated Split HVAC Systems", "MPM-HVAC-2025-01"), unit config uses `hvac_capacity` field name. This makes the template confusing for non-HVAC categories like Painting, Plumbing, etc.
2. **No CSV/XLS import**: Only JSON template import exists. Users expect to upload spreadsheet files (CSV/XLSX) to populate RFQ fields.
3. **Progressive save not working**: RFQ creation requires filling all tabs before saving — no auto-save or "Save Draft" behavior. Documents can't be uploaded until first save.
4. **Default codes/compliance HVAC-specific**: `codes_compliance` defaults include ASHRAE, SMACNA — only relevant to HVAC.

### Session/Page Access Issues
5. **Profile cache TTL too long**: 5-minute cache (`CACHE_TTL = 5 * 60 * 1000`) in `OptimizedAuthContext.tsx` means auth state can go stale. When the Supabase token refreshes, the profile cache doesn't invalidate, causing role checks to fail until the next cache miss — hence "pages fail to work except after reload."
6. **TOKEN_REFRESHED event not handled**: The `onAuthStateChange` listener processes `SIGNED_IN` and `SIGNED_OUT` but doesn't invalidate cache on `TOKEN_REFRESHED`, causing stale auth after token rotation.

### Security Issues (from scan)
7. **Realtime channels unprotected**: `projects` and `notifications` tables published to Realtime with no RLS on `realtime.messages`. Any authenticated user can subscribe to any channel.
8. **Views may still bypass RLS**: Scanner flags `bookings_staff_view`, `vendor_documents_safe`, `vendor_invoice_summary` — however, migrations already add `security_invoker = true`. This may be a stale scan result, but we'll verify and re-apply if needed.
9. **`sent_emails` INSERT too permissive**: `sent_emails_system_insert` allows ANY user (including `public` role) to insert rows.
10. **Leaked Password Protection**: Manual Supabase Dashboard action required.

---

## Plan (6 Steps)

### Step 1: Make RFQ Template Category-Agnostic
**File: `src/pages/admin/RFQEdit.tsx`**
- Change default `category` from `'hvac'` to `''` (empty, force selection)
- Rename `hvac_capacity` field to `capacity` in `UnitConfig` interface and all references
- Change table header from "HVAC Capacity" to "System Capacity"
- Update placeholder text throughout to be generic:
  - Title: "Project Title, Scope of Work..." (not "HVAC Technical")
  - RFQ Reference: "MPM-2025-01" (not "MPM-HVAC-2025-01")
  - Document Title: "Master Information Package" (not "HVAC Master Information Package")
  - Project Scope: "Full-scope installation, commissioning, maintenance..." 
  - System Type: "Dedicated systems for each unit"
  - Design Finality: "Design basis, system configuration, and quantities are final..."
- Change default `codes_compliance` to empty array `[]` (let user add relevant codes per category)
- Remove HVAC-specific default certifications from `staffing_requirements`

### Step 2: Add CSV/XLSX Template Import
**File: `src/pages/admin/RFQEdit.tsx`**
- Add a `handleImportCSV` function that reads CSV/XLSX files using Papa Parse (CSV) or SheetJS (XLSX)
- Map spreadsheet columns to RFQ form fields using a predefined column mapping
- Update the import button area to accept `.csv,.xlsx,.xls` in addition to `.json`
- Add a downloadable CSV template file export alongside JSON export
- The CSV template will have columns: `field_name`, `value` — a simple key-value format any user can fill in Excel

### Step 3: Enable Progressive Save (Auto-Save Draft)
**File: `src/pages/admin/RFQEdit.tsx`**
- After first save (create), redirect to `/admin/rfq/{id}/edit` (already done)
- Add a debounced auto-save: after 30s of inactivity with changes, auto-save as draft
- Show "Unsaved changes" indicator in header
- Allow document uploads immediately after first save by using the returned `id`

### Step 4: Fix Session/Auth Cache Staleness
**File: `src/contexts/OptimizedAuthContext.tsx`**
- Reduce `CACHE_TTL` from 5 minutes to 2 minutes
- Handle `TOKEN_REFRESHED` event in `onAuthStateChange`: invalidate profile cache and re-fetch
- This fixes pages becoming inaccessible without reload after token rotation

### Step 5: Fix Realtime Security
**Migration SQL:**
- Remove `projects` and `notifications` from `supabase_realtime` publication
- This eliminates unauthorized channel subscriptions entirely
- App uses direct queries (not realtime subscriptions) for these tables in practice

### Step 6: Tighten `sent_emails` INSERT Policy
**Migration SQL:**
- Drop `sent_emails_system_insert` (allows `public` role)
- Replace with policy restricted to `authenticated` role with `sent_by = auth.uid()` check
- Keep admin full-access policy unchanged

---

## Files to Modify
1. `src/pages/admin/RFQEdit.tsx` — Category-agnostic template, CSV/XLSX import, progressive save
2. `src/contexts/OptimizedAuthContext.tsx` — Reduce cache TTL, handle TOKEN_REFRESHED
3. **Migration SQL** — Remove tables from realtime publication, tighten sent_emails INSERT

## Not Changed
- Leaked Password Protection — manual Supabase Dashboard action (documented)
- Views with `security_invoker = true` — already applied in existing migrations

