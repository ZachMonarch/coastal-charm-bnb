-- ============================================================================
-- PHASE 1 CRITICAL FIX: VENDOR PAYMENTS INSERT POLICY
-- ============================================================================
-- Allow admins and property managers to create vendor payments
-- Fixes: "unable to create invoice payment, unable to assign payment requests to users"

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "vendor_payments_admin_insert" ON public.vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_admin_create" ON public.vendor_payments;

-- Create unified INSERT policy for vendor_payments
CREATE POLICY "vendor_payments_admin_insert_unified" ON public.vendor_payments
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user(auth.uid()) 
  OR user_has_role(auth.uid(), 'property_manager')
);

-- Ensure SELECT and UPDATE policies exist for admins
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendor_payments' 
    AND policyname = 'vendor_payments_admin_select'
  ) THEN
    CREATE POLICY "vendor_payments_admin_select" ON public.vendor_payments
    FOR SELECT
    TO authenticated
    USING (
      is_admin_user(auth.uid()) 
      OR user_has_role(auth.uid(), 'property_manager')
      OR vendor_id = auth.uid()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendor_payments' 
    AND policyname = 'vendor_payments_admin_update'
  ) THEN
    CREATE POLICY "vendor_payments_admin_update" ON public.vendor_payments
    FOR UPDATE
    TO authenticated
    USING (
      is_admin_user(auth.uid()) 
      OR user_has_role(auth.uid(), 'property_manager')
    )
    WITH CHECK (
      is_admin_user(auth.uid()) 
      OR user_has_role(auth.uid(), 'property_manager')
    );
  END IF;
END $$;

-- ============================================================================
-- PHASE 1 CRITICAL FIX: CLEAN UP TEST ACCOUNTS
-- ============================================================================
-- Remove test user accounts that clutter the database
-- Preserves audit trail by logging before deletion

-- Step 1: Create backup of test profiles in audit_logs
INSERT INTO public.audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  old_values,
  new_values
)
SELECT 
  id,
  'TEST_USER_CLEANUP',
  'profiles',
  id::text,
  row_to_json(profiles)::jsonb,
  jsonb_build_object('deleted_at', NOW(), 'reason', 'test_account_cleanup')
FROM public.profiles
WHERE 
  full_name ILIKE '%test%'
  OR email ILIKE '%test%'
  OR email ILIKE '%example.com%'
  OR full_name ILIKE '%hacker%'
  OR full_name ILIKE '%placeholder%';

-- Step 2: Delete test user roles
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE 
    full_name ILIKE '%test%'
    OR email ILIKE '%test%'
    OR email ILIKE '%example.com%'
    OR full_name ILIKE '%hacker%'
    OR full_name ILIKE '%placeholder%'
);

-- Step 3: Delete test vendor profiles
DELETE FROM public.vendor_profiles
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE 
    full_name ILIKE '%test%'
    OR email ILIKE '%test%'
    OR email ILIKE '%example.com%'
    OR full_name ILIKE '%hacker%'
    OR full_name ILIKE '%placeholder%'
);

-- Step 4: Delete test profiles
DELETE FROM public.profiles
WHERE 
  full_name ILIKE '%test%'
  OR email ILIKE '%test%'
  OR email ILIKE '%example.com%'
  OR full_name ILIKE '%hacker%'
  OR full_name ILIKE '%placeholder%';

-- Log cleanup summary
INSERT INTO public.audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  NULL,
  'TEST_ACCOUNT_CLEANUP_COMPLETE',
  'profiles,user_roles,vendor_profiles',
  'phase1_cleanup',
  jsonb_build_object(
    'deleted_profiles', (SELECT COUNT(*) FROM public.profiles WHERE full_name ILIKE '%test%'),
    'reason', 'Remove test accounts to clean database',
    'completed_at', NOW(),
    'backup_location', 'audit_logs table'
  )
);