-- ============================================
-- PHASE 2: CRITICAL SECURITY FIXES
-- Storage RLS + Financial Reports + Vendor Applications
-- ============================================

-- ============================================
-- PART 1: STORAGE RLS POLICIES (CRITICAL - UNBLOCKS FILE UPLOADS)
-- ============================================

-- Create comprehensive RLS policies for vendor_avatars bucket
CREATE POLICY "vendor_avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor_avatars');

CREATE POLICY "vendor_avatars_authenticated_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor_avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "vendor_avatars_own_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor_avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vendor_avatars_own_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor_avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create comprehensive RLS policies for vendor_docs bucket (private)
CREATE POLICY "vendor_docs_owner_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor_docs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin_user(auth.uid())
  )
);

CREATE POLICY "vendor_docs_authenticated_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor_docs' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "vendor_docs_own_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor_docs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin_user(auth.uid())
  )
);

CREATE POLICY "vendor_docs_own_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor_docs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin_user(auth.uid())
  )
);

-- Create comprehensive RLS policies for avatars bucket (public)
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_authenticated_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_own_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars_own_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create comprehensive RLS policies for documents bucket (private)
CREATE POLICY "documents_authenticated_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin_user(auth.uid())
    OR user_has_role(auth.uid(), 'property_manager')
  )
);

CREATE POLICY "documents_authenticated_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "documents_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin_user(auth.uid())
  )
);

CREATE POLICY "documents_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin_user(auth.uid())
  )
);

-- Set storage size limits for security
UPDATE storage.buckets 
SET file_size_limit = 5242880 -- 5MB
WHERE id IN ('vendor_avatars', 'avatars');

UPDATE storage.buckets 
SET file_size_limit = 10485760 -- 10MB
WHERE id IN ('vendor_docs', 'documents');

-- ============================================
-- PART 2: FIX FINANCIAL REPORTS RLS
-- ============================================

-- Drop overly restrictive policy
DROP POLICY IF EXISTS "Users can view financial reports based on role" ON financial_reports;

-- Create proper admin + property_manager access policy
CREATE POLICY "financial_reports_admin_pm_access"
ON financial_reports FOR SELECT
USING (
  is_admin_user(auth.uid()) 
  OR user_has_role(auth.uid(), 'property_manager')
);

CREATE POLICY "financial_reports_admin_pm_insert"
ON financial_reports FOR INSERT
WITH CHECK (
  is_admin_user(auth.uid()) 
  OR user_has_role(auth.uid(), 'property_manager')
);

CREATE POLICY "financial_reports_admin_pm_update"
ON financial_reports FOR UPDATE
USING (
  is_admin_user(auth.uid()) 
  OR user_has_role(auth.uid(), 'property_manager')
);

-- ============================================
-- PART 3: FIX VENDOR APPLICATIONS RLS
-- ============================================

-- Drop overly restrictive policy
DROP POLICY IF EXISTS "Users can view vendor applications based on role" ON vendor_applications;

-- Allow vendors to view their own applications
CREATE POLICY "vendor_applications_own_view"
ON vendor_applications FOR SELECT
USING (
  user_id = auth.uid()
);

-- Allow admins to view all applications
CREATE POLICY "vendor_applications_admin_view"
ON vendor_applications FOR SELECT
USING (
  is_admin_user(auth.uid())
);

-- Allow authenticated users to create applications
CREATE POLICY "vendor_applications_authenticated_insert"
ON vendor_applications FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND user_id = auth.uid()
);

-- Allow vendors to update their own pending applications
CREATE POLICY "vendor_applications_own_update"
ON vendor_applications FOR UPDATE
USING (
  user_id = auth.uid()
  AND status = 'pending'
);

-- Allow admins to update all applications
CREATE POLICY "vendor_applications_admin_update"
ON vendor_applications FOR UPDATE
USING (
  is_admin_user(auth.uid())
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify storage policies (should return 16+ policies)
-- SELECT COUNT(*) as storage_policies FROM pg_policies WHERE schemaname = 'storage';

-- Verify financial_reports policies (should return 3)
-- SELECT COUNT(*) as financial_reports_policies FROM pg_policies WHERE tablename = 'financial_reports';

-- Verify vendor_applications policies (should return 5)
-- SELECT COUNT(*) as vendor_applications_policies FROM pg_policies WHERE tablename = 'vendor_applications';

-- Log the security fix
INSERT INTO audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  auth.uid(),
  'SECURITY_HARDENING_PHASE_2',
  'storage.objects',
  'storage_rls_applied',
  jsonb_build_object(
    'storage_policies', 'applied',
    'financial_reports_fixed', true,
    'vendor_applications_fixed', true,
    'timestamp', now()
  )
);