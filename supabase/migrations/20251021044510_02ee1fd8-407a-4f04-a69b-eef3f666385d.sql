-- Fix vendor_documents RLS policies to allow profile avatar and logo uploads
-- Issue: Vendors unable to upload profile avatars and company logos
-- Root cause: RLS policy blocking INSERT operations

-- Drop existing policies to rebuild them correctly
DROP POLICY IF EXISTS "vendor_documents_unified_access" ON vendor_documents;

-- Create comprehensive vendor documents policies
-- Policy 1: Vendors can view their own documents and admins can view all
CREATE POLICY "vendor_documents_select"
ON vendor_documents FOR SELECT
TO authenticated
USING (
  vendor_id = auth.uid() OR
  is_admin_user(auth.uid())
);

-- Policy 2: Vendors can INSERT their own documents (critical for avatar/logo uploads)
CREATE POLICY "vendor_documents_insert"
ON vendor_documents FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id = auth.uid() OR
  is_admin_user(auth.uid())
);

-- Policy 3: Vendors can UPDATE their own documents, admins can update all
CREATE POLICY "vendor_documents_update"
ON vendor_documents FOR UPDATE
TO authenticated
USING (
  vendor_id = auth.uid() OR
  is_admin_user(auth.uid())
)
WITH CHECK (
  vendor_id = auth.uid() OR
  is_admin_user(auth.uid())
);

-- Policy 4: Vendors can DELETE their own documents, admins can delete all
CREATE POLICY "vendor_documents_delete"
ON vendor_documents FOR DELETE
TO authenticated
USING (
  vendor_id = auth.uid() OR
  is_admin_user(auth.uid())
);

-- Ensure the vendor-assets storage bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-assets',
  'vendor-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']::text[];

-- Fix storage.objects policies for vendor-assets bucket
DROP POLICY IF EXISTS "vendor_assets_vendor_insert" ON storage.objects;
DROP POLICY IF EXISTS "vendor_assets_vendor_select" ON storage.objects;
DROP POLICY IF EXISTS "vendor_assets_vendor_update" ON storage.objects;
DROP POLICY IF EXISTS "vendor_assets_vendor_delete" ON storage.objects;

-- Create storage policies for vendor-assets
CREATE POLICY "vendor_assets_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin_user(auth.uid()))
);

CREATE POLICY "vendor_assets_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin_user(auth.uid()))
);

CREATE POLICY "vendor_assets_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin_user(auth.uid()))
);

CREATE POLICY "vendor_assets_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR is_admin_user(auth.uid()))
);