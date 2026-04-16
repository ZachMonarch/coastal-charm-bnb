

# Plan: Fix Property Creation + RFQ Multi-Property Hierarchy

## Findings

### Issue 1: Property Creation Fails
**Root cause**: The `properties.id` column (bigint) has a sequence (`properties_id_seq`) but the column default is NOT set. Inserts without an explicit `id` fail with a null violation. The sequence exists but was never wired as the column default.

**Fix**: Migration to set `ALTER TABLE properties ALTER COLUMN id SET DEFAULT nextval('properties_id_seq')`.

### Issue 2: RFQ → Property is 1:1 Only
Currently `rfqs.property_id` is a single bigint FK. The user needs:
- **One RFQ Project** → **2-5 Properties** (different locations under one contract)
- **Each Property** → **5-8 Service RFQs** (painting, cleaning, plumbing, etc.)

This requires a junction table: `rfq_properties` linking rfqs to multiple properties, plus a `service_type` field so each property-service pair is a distinct bid target.

### Issue 3: No UI to Link Properties to RFQ
The RFQ editor has a single property dropdown. Needs a multi-property selector with per-property service assignments.

---

## Implementation Steps

### Step 1 — Migration: Fix properties.id default + Create rfq_properties table

```sql
-- Fix property creation
ALTER TABLE properties ALTER COLUMN id SET DEFAULT nextval('properties_id_seq');

-- Junction table: RFQ ↔ Properties with service types
CREATE TABLE IF NOT EXISTS public.rfq_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  property_id bigint NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  service_types text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rfq_id, property_id)
);

ALTER TABLE rfq_properties ENABLE ROW LEVEL SECURITY;

-- RLS: same access as rfqs (admin + property_manager)
CREATE POLICY "rfq_properties_select" ON rfq_properties FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM rfqs WHERE rfqs.id = rfq_id AND (
    rfqs.created_by = auth.uid() OR is_admin_user(auth.uid())
  )));
CREATE POLICY "rfq_properties_insert" ON rfq_properties FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'property_manager'
  ));
CREATE POLICY "rfq_properties_update" ON rfq_properties FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));
CREATE POLICY "rfq_properties_delete" ON rfq_properties FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));
```

### Step 2 — Fix AdminPropertyManagement.tsx
- No code change needed — the insert already omits `id`, so fixing the column default resolves the creation failure.

### Step 3 — Update RFQEdit.tsx: Multi-Property + Service Assignment UI
- Replace single property dropdown with a multi-property selector panel
- For each linked property, show checkboxes for service types (painting, cleaning, landscaping, plumbing, electrical, HVAC, roofing, general)
- On save, upsert `rfq_properties` rows alongside the RFQ save
- Keep legacy `rfqs.property_id` as nullable (backward compat); new flow uses `rfq_properties`
- Add a "Properties & Services" tab to RFQ_TABS

### Step 4 — Update RFQ Management/List views
- Show linked property count and service breakdown in the RFQ list table
- Query `rfq_properties` with property details when viewing an RFQ

---

## Files Changed
1. **New migration** — Fix `properties.id` default + create `rfq_properties` table with RLS
2. `src/pages/admin/RFQEdit.tsx` — Multi-property selector UI, save logic for `rfq_properties`
3. `src/components/rfq/PropertyServiceSelector.tsx` — New component: searchable property picker with per-property service checkboxes

## Not Changed
- `AdminPropertyManagement.tsx` — insert code is already correct; only the DB default was missing
- Existing `rfqs.property_id` — kept for backward compatibility with existing RFQs

