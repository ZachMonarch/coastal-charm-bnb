-- ============================================================
-- PHASE 4 FIX: Create Missing Vendor Storage Buckets
-- ============================================================
-- ROOT CAUSE: vendor_avatars and vendor_docs buckets referenced 
-- in policies but never created. This causes "bucket not found" 
-- errors disguised as RLS violations.
-- ============================================================

-- Create vendor_avatars bucket (public, 5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor_avatars',
  'vendor_avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Create vendor_docs bucket (private, 10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor_docs',
  'vendor_docs',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

-- ============================================================
-- Storage RLS Policies (ensure they exist)
-- ============================================================

-- VENDOR_AVATARS policies (public bucket)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor_avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor_avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vendor_avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor_avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vendor_avatars');

-- VENDOR_DOCS policies (private bucket)
DROP POLICY IF EXISTS "Authenticated users can upload vendor docs" ON storage.objects;
CREATE POLICY "Authenticated users can upload vendor docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor_docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own vendor docs" ON storage.objects;
CREATE POLICY "Users can view their own vendor docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor_docs' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin_user(auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own vendor docs" ON storage.objects;
CREATE POLICY "Users can update their own vendor docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor_docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vendor_docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own vendor docs" ON storage.objects;
CREATE POLICY "Users can delete their own vendor docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor_docs' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin_user(auth.uid())
  )
);

-- ============================================================
-- Audit & Verification
-- ============================================================

-- Log the bucket creation
INSERT INTO audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  auth.uid(),
  'STORAGE_BUCKETS_CREATED',
  'storage.buckets',
  'vendor_avatars,vendor_docs',
  jsonb_build_object(
    'vendor_avatars_created', true,
    'vendor_docs_created', true,
    'timestamp', now()
  )
);

-- Verify buckets exist
DO $$
DECLARE
  avatar_bucket_exists BOOLEAN;
  docs_bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'vendor_avatars') INTO avatar_bucket_exists;
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'vendor_docs') INTO docs_bucket_exists;
  
  IF NOT avatar_bucket_exists THEN
    RAISE EXCEPTION 'Failed to create vendor_avatars bucket';
  END IF;
  
  IF NOT docs_bucket_exists THEN
    RAISE EXCEPTION 'Failed to create vendor_docs bucket';
  END IF;
  
  RAISE NOTICE '✅ Vendor storage buckets created successfully';
END $$;