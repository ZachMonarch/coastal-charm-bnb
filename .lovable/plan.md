
# Comprehensive Fix Plan: Admin Role, RFQ Access, and Vendor Management

## Executive Summary

**Issue Analysis Complete**. Through thorough investigation, I have identified the following root causes:

### Issue 1: Admin User Showing as "Vendor" with "Pending Approval"

**Root Cause**: The admin user (`admin@monarchpropertymmgt.com`) has a stale approval request in the database with `status: 'pending'` and `role_requested: 'vendor'` from October 2025. The Settings page checks for pending requests BEFORE checking the actual user role, causing it to display "Vendor - Pending Approval" even though the user already has the `admin` role in the `user_roles` table.

**Database Evidence**:
```
user_roles table: role = 'admin' ✓ (CORRECT)
user_approval_requests table: status = 'pending', role_requested = 'vendor' ✗ (STALE DATA)
```

**Solution**: 
1. Delete or mark as resolved the stale approval request for the admin user
2. Update the Settings UI logic to SKIP pending approval display for users who already have the requested role (or higher)

---

### Issue 2: Admin Unable to Access/Edit RFQ Projects

**Root Cause**: The vendor query in `RFQEdit.tsx` line 217 uses `service_categories` which does NOT exist in the `vendor_profiles` table. The correct column name is `specialties`.

**Database Schema**:
```
vendor_profiles columns: id, user_id, company_name, specialties (ARRAY), ...
NO column named 'service_categories'
```

**Solution**: Change the query from `service_categories` to `specialties` in the RFQ vendor invite functionality.

---

### Issue 3: Payment Methods Viewer Shows "Not Yet Configured"

**Root Cause**: The `PaymentMethodsViewer` component uses incorrect column names:
- Uses `payment_type` but actual column is `type`
- Uses `is_primary` but actual column is `is_default`

**Database Schema**:
```
vendor_payment_methods columns: id, vendor_id, type, is_default, ...
NO columns named 'payment_type' or 'is_primary'
```

**Solution**: Update the PaymentMethodsViewer interface and RPC function to use correct column names.

---

## Implementation Plan

### Phase 1: Database Cleanup - Remove Stale Admin Approval Request

**Action**: Delete or update the stale pending approval request for the admin user.

**SQL to execute** (via Supabase SQL Editor):
```sql
-- Option 1: Delete the stale request (RECOMMENDED)
DELETE FROM user_approval_requests 
WHERE user_id = '57f850b4-d457-450f-bdf1-7bd7e35c93d5'
AND status = 'pending';

-- OR Option 2: Mark as approved (if you want to keep history)
UPDATE user_approval_requests 
SET status = 'approved', 
    reviewed_at = NOW(),
    admin_notes = 'Auto-resolved: User already has admin role'
WHERE user_id = '57f850b4-d457-450f-bdf1-7bd7e35c93d5'
AND status = 'pending';
```

---

### Phase 2: Fix Settings Page Role Display Logic

**File**: `src/pages/UnifiedSettings.tsx`

**Current Code (lines 186-198)**:
```tsx
{hasPendingRequest && existingRequest ? (
  <>
    <span className="text-sm font-semibold capitalize text-primary">
      {existingRequest.role_requested}
    </span>
    <span className="...">Pending Approval</span>
  </>
) : (
  <span className="...">{actualRole}</span>
)}
```

**Problem**: Shows "Pending Approval" even if user ALREADY has the role or a higher role.

**Fix**: Add logic to check if user already has the requested role:
```tsx
{/* Only show pending if user doesn't already have the role */}
{hasPendingRequest && existingRequest && !hasRole(existingRequest.role_requested as any) && !hasRole('admin') ? (
  <>
    <span className="text-sm font-semibold capitalize text-primary">
      {existingRequest.role_requested}
    </span>
    <span className="...">Pending Approval</span>
  </>
) : (
  <span className="...">{actualRole}</span>
)}
```

**Why**: Admins should NEVER see "Pending Approval" since they have the highest role. Users who already have the requested role should also not see pending status.

---

### Phase 3: Fix RFQ Vendor Query

**File**: `src/pages/admin/RFQEdit.tsx`

**Current Code (lines 215-219)**:
```tsx
const { data, error } = await supabase
  .from('vendor_profiles')
  .select('user_id, company_name, service_categories, rating')  // WRONG
  .eq('is_verified', true)
  .order('rating', { ascending: false });
```

**Fix**: Change `service_categories` to `specialties`:
```tsx
const { data, error } = await supabase
  .from('vendor_profiles')
  .select('user_id, company_name, specialties, rating')  // CORRECT
  .eq('is_verified', true)
  .order('rating', { ascending: false });
```

**Also update line 511** where it displays the categories:
```tsx
// Current:
<p className="text-sm text-muted-foreground">{Array.isArray(vendor.service_categories) ? vendor.service_categories.join(', ') : 'General'}</p>

// Fix:
<p className="text-sm text-muted-foreground">{Array.isArray(vendor.specialties) ? vendor.specialties.join(', ') : 'General'}</p>
```

---

### Phase 4: Fix Payment Methods Viewer

**File**: `src/components/admin/PaymentMethodsViewer.tsx`

**Current Interface (lines 6-12)**:
```tsx
interface PaymentMethod {
  id: string;
  payment_type: string;   // WRONG - should be 'type'
  is_primary: boolean;    // WRONG - should be 'is_default'
  created_at: string;
  vendor_id: string;
}
```

**Fix Interface**:
```tsx
interface PaymentMethod {
  id: string;
  type: string;           // CORRECT
  is_default: boolean;    // CORRECT
  created_at: string;
  vendor_id: string;
}
```

**Update UI Code (lines 88-105)**:
```tsx
// Change payment_type references to type
{method.type === 'bank_account' ? (

// Change is_primary references to is_default
{method.is_default && (
```

Also update the RPC function to return correct column names.

**SQL Migration** (if RPC returns wrong columns):
```sql
-- Update the RPC to return correct column names
CREATE OR REPLACE FUNCTION admin_get_vendor_payment_methods(target_vendor_id uuid)
RETURNS TABLE (
  id uuid,
  vendor_id uuid,
  type text,           -- was payment_type
  is_default boolean,  -- was is_primary
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Log the access
  INSERT INTO audit_logs (action, user_id, table_name, record_id, new_values, created_at)
  VALUES (
    'ADMIN_VIEWED_PAYMENT_METHODS',
    auth.uid(),
    'vendor_payment_methods',
    target_vendor_id::text,
    jsonb_build_object('target_vendor_id', target_vendor_id),
    now()
  );
  
  -- Return non-sensitive payment method data with correct column names
  RETURN QUERY
  SELECT 
    vpm.id,
    vpm.vendor_id,
    vpm.type,
    vpm.is_default,
    vpm.created_at
  FROM vendor_payment_methods vpm
  WHERE vpm.vendor_id = target_vendor_id;
END;
$$;
```

---

### Phase 5: Add Admin Verification on Dashboard

**File**: `src/pages/Dashboard.tsx` (already fixed)

The Dashboard.tsx already has the correct admin bypass at line 72-81. No changes needed.

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| Database: `user_approval_requests` | Delete stale pending request for admin user | CRITICAL |
| `src/pages/UnifiedSettings.tsx` | Fix role display logic to skip pending for admins | HIGH |
| `src/pages/admin/RFQEdit.tsx` | Change `service_categories` to `specialties` | HIGH |
| `src/components/admin/PaymentMethodsViewer.tsx` | Fix interface: `type` and `is_default` | HIGH |
| Database: `admin_get_vendor_payment_methods` RPC | Update RETURN TABLE columns | MEDIUM |

---

## Expected Outcomes

After implementation:

1. **Admin Role Display**: Settings page shows "Admin" for admin@monarchpropertymmgt.com, not "Vendor - Pending Approval"

2. **RFQ Access**: Admin can fully access and edit RFQ projects including:
   - View and search vendor list
   - Invite vendors to RFQs
   - Edit all RFQ details

3. **Payment Methods**: Admin can view vendor payment methods without error:
   - Dialog shows payment method type (bank/card)
   - Shows default status correctly
   - Audit log entry created

4. **No Role Confusion**: Admin users never see access gates, pending approvals, or vendor-specific restrictions

---

## Validation Steps

After implementation, verify:

1. **Settings Page Test**:
   - Login as admin@monarchpropertymmgt.com
   - Navigate to Settings → Profile
   - Verify "Role: Admin" is displayed (no pending approval badge)

2. **RFQ Edit Test**:
   - Navigate to `/admin/rfq/new` or edit existing RFQ
   - Click "Invite Vendors" button
   - Verify vendor list loads without console errors
   - Verify specialties are displayed correctly

3. **Payment Methods Test**:
   - Navigate to Admin → Vendors tab
   - Click the "$" button on any vendor row
   - Verify payment methods load (or "No payment methods on file" if none)
   - No "not yet configured" error

4. **Database Verification**:
   ```sql
   -- Verify no pending requests for admin
   SELECT * FROM user_approval_requests 
   WHERE user_id = '57f850b4-d457-450f-bdf1-7bd7e35c93d5';
   -- Should return 0 rows or all rows with status != 'pending'
   ```

---

## Manual Action Required

**Enable Leaked Password Protection** in Supabase Dashboard (existing requirement):
1. Navigate to Authentication → Settings → Password Security
2. Enable "Leaked Password Protection"
3. Set mode to "Block"
