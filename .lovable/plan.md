

# Plan: RFQ System — Complete Remaining Fixes

## Findings Summary

| # | Issue | Root Cause | Severity |
|---|-------|-----------|----------|
| 1 | **Admin can't create RFQ** | `/admin/rfq/create-detailed` route has no `:id` param → `useParams` returns `undefined` → `isNew = (undefined === 'new')` = `false` → component tries to FETCH and UPDATE a nonexistent RFQ instead of creating | **CRITICAL** |
| 2 | **No Edit button in RFQ list** | `UnifiedRFQManagement.tsx` Actions column only has "View" button, no "Edit" link | Medium |
| 3 | **No Share Link on Detail page** | `ComprehensiveRFQDetail.tsx` has Edit button (line 185) but no "Share Link" / "Copy Vendor Link" button | Medium |
| 4 | **Vendor share link requires auth** | `/vendor/rfq/:id/details` is wrapped in `OptimizedProtectedRoute requiredRole="vendor"` — unauthenticated recipients can't access shared links | Medium |
| 5 | **Image uploads blocked at storage level** | `rfq-documents` bucket `allowed_mime_types` only includes `pdf, png, jpeg, docx, dwg, dxf` — missing `image/gif, image/webp, image/svg+xml, image/tiff` that the UI now accepts | Medium |
| 6 | **Create RFQ button URL** | `UnifiedRFQManagement.tsx` line 139 points to `/admin/rfq/create` (redirects work but adds unnecessary hop) | Low |

---

## Plan (6 Steps)

### Step 1: Fix RFQ Creation — Critical Route Bug
**File: `src/pages/admin/RFQEdit.tsx`**
- Change `isNew` logic from `id === 'new'` to `!id || id === 'new'`
- This handles both `/admin/rfq/create-detailed` (no `id` param → `undefined`) and legacy `/admin/rfq/new/edit` patterns
- Also fix the fetch query `enabled` check: `enabled: !!id && !isNew` → `enabled: !!id && id !== 'new'`

### Step 2: Add Edit Button to RFQ List
**File: `src/pages/admin/UnifiedRFQManagement.tsx`**
- Add "Edit" button next to "View" in the Actions column for each RFQ row
- Navigate to `/admin/rfq/${rfq.id}/edit`
- Fix Create RFQ href from `/admin/rfq/create` to `/admin/rfq/create-detailed`

### Step 3: Add Share Link Button to ComprehensiveRFQDetail
**File: `src/pages/admin/ComprehensiveRFQDetail.tsx`**
- Add "Copy Link" and "Share to Vendor" buttons in the header next to the existing "Edit RFQ" button
- Copy admin URL and vendor-accessible URL respectively, with toast confirmation

### Step 4: Make Vendor RFQ Detail Publicly Accessible
**File: `src/App.tsx`**
- Change the `/vendor/rfq/:id/details` route from `OptimizedProtectedRoute requiredRole="vendor"` to no auth protection (or authenticated-only without role restriction)
- This allows shared links to work for any authenticated user (vendors logging in via the link)

### Step 5: Update Storage Bucket Allowed MIME Types
**Migration SQL:**
- Update `rfq-documents` bucket `allowed_mime_types` to include `image/gif`, `image/webp`, `image/svg+xml`, `image/tiff`
- This ensures image uploads from the Documents tab actually succeed at the storage level

### Step 6: Fix Save Mutation for New RFQ (edge case)
**File: `src/pages/admin/RFQEdit.tsx`**
- In `saveMutation`, when `isNew` and save succeeds, navigate to `/admin/rfq/${data.id}/edit` (already done)
- Ensure the document upload path handles the transition from `undefined` id to actual id after first save

---

## Files to Modify
1. `src/pages/admin/RFQEdit.tsx` — Fix `isNew` detection, save flow
2. `src/pages/admin/UnifiedRFQManagement.tsx` — Edit button, fix Create URL
3. `src/pages/admin/ComprehensiveRFQDetail.tsx` — Share link buttons
4. `src/App.tsx` — Relax auth on vendor RFQ detail route
5. **Database migration** — Update `rfq-documents` bucket allowed MIME types

