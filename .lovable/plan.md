

# Plan: Domain Correction + RFQ System Overhaul

## Findings Summary

### 1. Domain Issue
All domain references already use `monarchpropertymmgt.online`. No `.com` references found across 46 files. **No code changes needed for domain.**

### 2. RFQ System Issues (Root Causes)

| Issue | Root Cause |
|-------|-----------|
| **Can't create/save RFQ** | The "Create RFQ" sidebar link goes to `/admin/rfq/create-detailed` which uses `RFQEdit.tsx` with `id="new"`. The save mutation works via direct `supabase.insert()` but requires `tenant_id` (NOT NULL). The old `/admin/rfq/create` route uses `RFQCreationForm` which calls `create_rfq` RPC that may not exist. Two competing creation paths cause confusion. |
| **Can't edit RFQ** | Route `/admin/rfq/:id/edit` exists and `RFQEdit.tsx` handles it. But `RFQManagement.tsx` row click navigates to `/admin/rfq/:id` (detail view), with no Edit button visible. No way to reach the edit page from the list. |
| **No file upload auto-fill** | Documents tab requires saving RFQ first (`isNew` check blocks upload). No JSON/PDF parsing to auto-populate template fields. |
| **No shareable link** | No copy-link button exists on admin RFQ detail or edit pages. The `AdminRFQSystem.tsx` has `handleShareProject` but uses wrong URL path. |
| **Property address without linking** | `RFQEdit.tsx` already has `project_address` in `document_control` section, and property is optional (`"none"` option). But the old `RFQCreationForm.tsx` requires `property_id`. |
| **No floor plans/photos upload** | Documents tab only accepts `.pdf,.doc,.docx,.dwg,.xlsx`. No image uploads (`.jpg,.png`) allowed. No separate floor plan/photo upload section. |

---

## Plan (8 Steps)

### Step 1: Consolidate RFQ Creation to One Path
- Remove the old `/admin/rfq/create` route and `RFQCreationForm.tsx` dependency
- Update sidebar "Create RFQ" link to `/admin/rfq/create-detailed` (already done)
- Update `RFQManagement.tsx` "Create RFQ" action button to point to `/admin/rfq/create-detailed`

### Step 2: Fix RFQ Save (Create New)
- In `RFQEdit.tsx`, the `isNew` path inserts directly. Verify `tenant_id` is properly fetched from `profiles`. Add fallback error handling if tenant_id is missing.
- Ensure the `properties` join (`properties(title, address)`) works — the `rfqs` table has `property_id` as `bigint` referencing `properties(id)`.

### Step 3: Add Edit Button to RFQ List & Detail
- In `RFQManagement.tsx`, add an "Edit" button in the Actions column that navigates to `/admin/rfq/:id/edit`
- In `RFQDetail.tsx`, add an "Edit" button in the header that navigates to `/admin/rfq/:id/edit`

### Step 4: Add Copy/Share Link Button
- In `RFQEdit.tsx` header (for saved RFQs): add a "Copy Link" button that copies `{origin}/admin/rfq/{id}` to clipboard
- In `RFQDetail.tsx` header: add a "Share Link" button that copies a vendor-viewable URL (`{origin}/vendor/rfq/{id}/details`)
- Toast confirmation on copy

### Step 5: Add Property Address Without Linking Property
- In `RFQEdit.tsx` Basic Info tab, add a "Project Address" text field (stored in `document_control.project_address`)
- Already exists in Document Control tab — add it also to Basic Info for visibility, syncing the value between the two
- Property select remains optional (already has "No property linked" option)

### Step 6: Allow Image Uploads (Floor Plans & Photos)
- In `RFQEdit.tsx` Documents tab, expand the `accept` attribute to include `.jpg,.jpeg,.png,.gif,.webp,.svg,.tiff`
- Add a document type selector (dropdown) when uploading: Specification, Blueprint, Floor Plan, MEP Design, Property Photo, Other
- Store the selected `document_type` and `category_badge` in `rfq_documents`

### Step 7: Add File Upload Auto-Fill (JSON Template Import)
- Add a "Import from JSON Template" button on the Basic Info tab
- Accept a `.json` file, parse it, and auto-populate the form fields (document_control, executive_summary, building_details, system_strategy, unit_configuration, technical_specs, commercial_framework, codes_compliance, staffing_requirements, budget_guidance)
- Add an "Export Template" button that downloads the current form data as a `.json` file for reuse
- Documents section remains manual (as requested)

### Step 8: Clean Up Old Create Route
- Remove the old `/admin/rfq/create` route from `App.tsx`
- Redirect `/admin/rfq/create` to `/admin/rfq/create-detailed`

---

## Files to Modify
1. **`src/pages/admin/RFQEdit.tsx`** — Share link, image uploads, document type selector, JSON import/export, project address in Basic Info
2. **`src/pages/admin/RFQManagement.tsx`** — Edit button in table, fix Create button URL
3. **`src/pages/admin/RFQDetail.tsx`** — Edit + Share buttons in header
4. **`src/App.tsx`** — Redirect old create route
5. **`src/components/AppSidebar.tsx`** — Already correct (points to create-detailed)

## Files NOT Modified
- Domain files (already correct)
- Database schema (no migration needed — all columns exist)
- `RFQCreationForm.tsx` / `usePhase9RFQ.ts` — left in place but unused by primary flow

