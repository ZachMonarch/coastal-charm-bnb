-- =====================================================
-- FIX FINAL RLS WARNINGS - PART 3 (FINAL)
-- =====================================================
-- Fixes:
-- 1. properties - Fix overlapping FOR ALL policy
-- 2. vendor_payments - Consolidate 2 SELECT policies
-- 3. vendor_payouts - Consolidate 2 SELECT policies  
-- 4. vendor_profiles - Consolidate 3+ policies
-- 5. Drop duplicate index on vendor_profiles
-- =====================================================

-- ============ FIX PROPERTIES TABLE ============
-- The issue: properties_unified_write uses FOR ALL which overlaps with SELECT
-- Solution: Change FOR ALL to specific operations (INSERT, UPDATE, DELETE)

DROP POLICY IF EXISTS "properties_unified_write" ON public.properties;

-- Recreate as separate policies for write operations only
CREATE POLICY "properties_unified_insert"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user((select auth.uid())));

CREATE POLICY "properties_unified_update"
ON public.properties
FOR UPDATE
TO authenticated
USING (is_admin_user((select auth.uid())))
WITH CHECK (is_admin_user((select auth.uid())));

CREATE POLICY "properties_unified_delete"
ON public.properties
FOR DELETE
TO authenticated
USING (is_admin_user((select auth.uid())));

-- SELECT policy already exists: properties_unified_select

-- ============ FIX VENDOR_PAYMENTS TABLE ============
-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "vendor_payments_admin_manage" ON public.vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_vendor_own" ON public.vendor_payments;

-- Create consolidated SELECT policy
CREATE POLICY "vendor_payments_unified_select"
ON public.vendor_payments
FOR SELECT
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  vendor_id = (select auth.uid())
);

-- Admin-only write operations
CREATE POLICY "vendor_payments_admin_write"
ON public.vendor_payments
FOR ALL
TO authenticated
USING (is_admin_user((select auth.uid())))
WITH CHECK (is_admin_user((select auth.uid())));

-- ============ FIX VENDOR_PAYOUTS TABLE ============
-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "vendor_payouts_admin_access" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_vendor_own" ON public.vendor_payouts;

-- Create consolidated SELECT policy
CREATE POLICY "vendor_payouts_unified_select"
ON public.vendor_payouts
FOR SELECT
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  vendor_id = (select auth.uid())
);

-- Admin-only write operations
CREATE POLICY "vendor_payouts_admin_write"
ON public.vendor_payouts
FOR ALL
TO authenticated
USING (is_admin_user((select auth.uid())))
WITH CHECK (is_admin_user((select auth.uid())));

-- ============ FIX VENDOR_PROFILES TABLE ============
-- Drop all existing policies
DROP POLICY IF EXISTS "vendor_profiles_admin_access" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_own_only" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_restricted_public_read" ON public.vendor_profiles;

-- Create single comprehensive SELECT policy
-- This combines: admin access, own profile access, and restricted public read
CREATE POLICY "vendor_profiles_unified_select"
ON public.vendor_profiles
FOR SELECT
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  user_id = (select auth.uid()) OR
  user_has_role((select auth.uid()), 'property_manager'::text)
);

-- Create unified write policies (admin or own profile only)
CREATE POLICY "vendor_profiles_unified_insert"
ON public.vendor_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user((select auth.uid())) OR
  user_id = (select auth.uid())
);

CREATE POLICY "vendor_profiles_unified_update"
ON public.vendor_profiles
FOR UPDATE
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  user_id = (select auth.uid())
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR
  user_id = (select auth.uid())
);

CREATE POLICY "vendor_profiles_unified_delete"
ON public.vendor_profiles
FOR DELETE
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  user_id = (select auth.uid())
);

-- ============ FIX DUPLICATE INDEX ============
-- Drop the duplicate index (keep idx_vendor_profiles_is_verified, drop idx_vendor_profiles_verified)
DROP INDEX IF EXISTS public.idx_vendor_profiles_verified;

-- =====================================================
-- FINAL VERIFICATION QUERIES
-- =====================================================
-- Run these to confirm all issues are resolved:

-- 1. Check for remaining duplicate permissive policies
-- SELECT tablename, cmd, count(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- AND permissive = 'PERMISSIVE'
-- GROUP BY tablename, cmd
-- HAVING count(*) > 1;
-- Expected: 0 rows

-- 2. Check for duplicate indexes
-- SELECT schemaname, tablename, array_agg(indexname) as duplicate_indexes
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename, indexdef
-- HAVING count(*) > 1;
-- Expected: 0 rows