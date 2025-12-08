-- =====================================================
-- FIX REMAINING RLS POLICY WARNINGS - PART 2
-- =====================================================
-- Consolidates remaining multiple permissive policies:
-- - properties (3 → 1 SELECT policy)
-- - system_settings (2 → 1 SELECT policy)
-- - vendor_applications (2 → 1 unified policy)
-- - vendor_bids (2 → 1 unified policy)
-- - vendor_document_comments (2 → 1 per action)
-- - vendor_documents (2 → 1 unified policy)
-- =====================================================

-- ============ FIX PROPERTIES TABLE ============
-- Drop multiple SELECT policies
DROP POLICY IF EXISTS "properties_admin_full_access" ON public.properties;
DROP POLICY IF EXISTS "properties_authenticated_read" ON public.properties;
DROP POLICY IF EXISTS "properties_manager_read" ON public.properties;

-- Create consolidated SELECT policy
CREATE POLICY "properties_unified_select"
ON public.properties
FOR SELECT
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  user_has_role((select auth.uid()), 'property_manager'::text) OR
  status = ANY (ARRAY['available'::text, 'published'::text])
);

-- Keep write policies for admin only
CREATE POLICY "properties_unified_write"
ON public.properties
FOR ALL
TO authenticated
USING (is_admin_user((select auth.uid())))
WITH CHECK (is_admin_user((select auth.uid())));

-- ============ FIX SYSTEM_SETTINGS TABLE ============
-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_admin_only_read" ON public.system_settings;

-- Create single unified policy for all operations
CREATE POLICY "system_settings_admin_only"
ON public.system_settings
FOR ALL
TO authenticated
USING (is_admin_user((select auth.uid())))
WITH CHECK (is_admin_user((select auth.uid())));

-- ============ FIX VENDOR_APPLICATIONS TABLE ============
-- Drop duplicate policies
DROP POLICY IF EXISTS "vendor_applications_admin_access" ON public.vendor_applications;
DROP POLICY IF EXISTS "vendor_applications_own_only" ON public.vendor_applications;

-- Create consolidated policy
CREATE POLICY "vendor_applications_unified_access"
ON public.vendor_applications
FOR ALL
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  (select auth.uid()) = user_id
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR
  (select auth.uid()) = user_id
);

-- ============ FIX VENDOR_BIDS TABLE ============
-- Drop duplicate policies
DROP POLICY IF EXISTS "vendor_bids_admin_access" ON public.vendor_bids;
DROP POLICY IF EXISTS "vendor_bids_own_only" ON public.vendor_bids;

-- Create consolidated policy
CREATE POLICY "vendor_bids_unified_access"
ON public.vendor_bids
FOR ALL
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  (select auth.uid()) = vendor_id
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR
  (select auth.uid()) = vendor_id
);

-- ============ FIX VENDOR_DOCUMENT_COMMENTS TABLE ============
-- Drop duplicate policies
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.vendor_document_comments;
DROP POLICY IF EXISTS "Vendors can view non-internal comments on own docs" ON public.vendor_document_comments;
DROP POLICY IF EXISTS "Vendors can insert responses to own docs" ON public.vendor_document_comments;

-- Create consolidated SELECT policy
CREATE POLICY "vendor_document_comments_unified_select"
ON public.vendor_document_comments
FOR SELECT
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  (
    (NOT is_internal) AND
    EXISTS (
      SELECT 1
      FROM vendor_documents vd
      WHERE vd.id = vendor_document_comments.document_id
      AND vd.vendor_id = (select auth.uid())
    )
  )
);

-- Create consolidated INSERT policy
CREATE POLICY "vendor_document_comments_unified_insert"
ON public.vendor_document_comments
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user((select auth.uid())) OR
  (
    comment_type = 'vendor_response'::text AND
    (NOT is_internal) AND
    EXISTS (
      SELECT 1
      FROM vendor_documents vd
      WHERE vd.id = vendor_document_comments.document_id
      AND vd.vendor_id = (select auth.uid())
    )
  )
);

-- Admin-only UPDATE and DELETE
CREATE POLICY "vendor_document_comments_admin_modify"
ON public.vendor_document_comments
FOR UPDATE
TO authenticated
USING (is_admin_user((select auth.uid())))
WITH CHECK (is_admin_user((select auth.uid())));

CREATE POLICY "vendor_document_comments_admin_delete"
ON public.vendor_document_comments
FOR DELETE
TO authenticated
USING (is_admin_user((select auth.uid())));

-- ============ FIX VENDOR_DOCUMENTS TABLE ============
-- Drop duplicate policies
DROP POLICY IF EXISTS "Admins can manage all vendor documents" ON public.vendor_documents;
DROP POLICY IF EXISTS "Vendors can manage their own documents" ON public.vendor_documents;

-- Create consolidated policy
CREATE POLICY "vendor_documents_unified_access"
ON public.vendor_documents
FOR ALL
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR
  vendor_id = (select auth.uid())
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR
  vendor_id = (select auth.uid())
);

-- =====================================================
-- VERIFICATION: Run this to confirm no duplicates remain
-- =====================================================
-- SELECT tablename, cmd, count(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- AND permissive = 'PERMISSIVE'
-- AND tablename IN ('properties', 'system_settings', 'vendor_applications', 'vendor_bids', 'vendor_document_comments', 'vendor_documents')
-- GROUP BY tablename, cmd
-- HAVING count(*) > 1;