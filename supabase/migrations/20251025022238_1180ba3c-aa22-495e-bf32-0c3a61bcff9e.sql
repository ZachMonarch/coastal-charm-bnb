
-- PHASE 2 FIX: Vendor Upload RLS - Final Fix Without Audit Log
-- Fixes "new row violates row-level security policy" for vendor_documents
-- Uses existing user_has_role function

-- Step 1: Drop old unified policy if exists
DROP POLICY IF EXISTS "vendor_documents_unified_access" ON vendor_documents;

-- Step 2: Create granular RLS policies using existing security definer function

-- SELECT policy: vendors read own docs, admins/PMs read all
CREATE POLICY "vendor_documents_select_policy" ON vendor_documents
  FOR SELECT
  USING (
    vendor_id = auth.uid() 
    OR public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'property_manager')
  );

-- INSERT policy: vendors insert own docs, admins insert any
CREATE POLICY "vendor_documents_insert_policy" ON vendor_documents
  FOR INSERT
  WITH CHECK (
    vendor_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- UPDATE policy: vendors update own docs, admins update any
CREATE POLICY "vendor_documents_update_policy" ON vendor_documents
  FOR UPDATE
  USING (
    vendor_id = auth.uid() 
    OR public.user_has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    vendor_id = auth.uid()
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- DELETE policy: vendors delete own docs, admins delete any
CREATE POLICY "vendor_documents_delete_policy" ON vendor_documents
  FOR DELETE
  USING (
    vendor_id = auth.uid() 
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- RLS FIX COMPLETE: vendor_documents now has proper granular policies
-- Vendors can only upload/manage their own documents
-- Admins have full access to all vendor documents
