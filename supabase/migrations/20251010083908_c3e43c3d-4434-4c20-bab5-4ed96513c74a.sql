-- ============================================================================
-- FINAL RLS POLICY FIX: vendor_payments and vendor_payouts
-- Remove SELECT from admin_write policies to eliminate overlap
-- ============================================================================

-- ============================================================================
-- 1. VENDOR_PAYMENTS: Fix overlapping policies
-- ============================================================================

-- Drop the conflicting admin_write policy (which included SELECT)
DROP POLICY IF EXISTS vendor_payments_admin_write ON public.vendor_payments;

-- Create separate admin policies for write operations only (no SELECT)
CREATE POLICY vendor_payments_admin_insert
  ON public.vendor_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user((SELECT auth.uid())));

CREATE POLICY vendor_payments_admin_update
  ON public.vendor_payments
  FOR UPDATE
  TO authenticated
  USING (is_admin_user((SELECT auth.uid())))
  WITH CHECK (is_admin_user((SELECT auth.uid())));

CREATE POLICY vendor_payments_admin_delete
  ON public.vendor_payments
  FOR DELETE
  TO authenticated
  USING (is_admin_user((SELECT auth.uid())));

-- Keep existing vendor_payments_unified_select (no changes needed)

-- ============================================================================
-- 2. VENDOR_PAYOUTS: Fix overlapping policies
-- ============================================================================

-- Drop the conflicting admin_write policy (which included SELECT)
DROP POLICY IF EXISTS vendor_payouts_admin_write ON public.vendor_payouts;

-- Create separate admin policies for write operations only (no SELECT)
CREATE POLICY vendor_payouts_admin_insert
  ON public.vendor_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user((SELECT auth.uid())));

CREATE POLICY vendor_payouts_admin_update
  ON public.vendor_payouts
  FOR UPDATE
  TO authenticated
  USING (is_admin_user((SELECT auth.uid())))
  WITH CHECK (is_admin_user((SELECT auth.uid())));

CREATE POLICY vendor_payouts_admin_delete
  ON public.vendor_payouts
  FOR DELETE
  TO authenticated
  USING (is_admin_user((SELECT auth.uid())));

-- Keep existing vendor_payouts_unified_select (no changes needed)