-- ============================================
-- PHASE 1: Storage & Avatar Upload Foundation
-- ============================================

-- Step 1: Create public-media bucket for instant-display avatars/logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-media', 
  'public-media', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: RLS Policies for public-media bucket
-- Anyone can view public media
CREATE POLICY "Anyone can view public media"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-media');

-- Users can upload to their own folder (avatars/{user_id}/ or logos/{user_id}/)
CREATE POLICY "Users can upload their own public media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own public media
CREATE POLICY "Users can update their own public media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own public media
CREATE POLICY "Users can delete their own public media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 3: Drop existing trigger and function (CASCADE handles dependencies)
DROP TRIGGER IF EXISTS update_vendor_avatar_trigger ON vendor_documents;
DROP TRIGGER IF EXISTS trigger_update_vendor_avatar ON vendor_documents;
DROP FUNCTION IF EXISTS update_vendor_avatar() CASCADE;

-- Step 4: Create improved avatar sync function
CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process logo and profile_image document types
  IF NEW.document_type IN ('logo', 'profile_image') THEN
    
    -- Update vendor_profiles.avatar_url (primary source for vendors)
    UPDATE vendor_profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE user_id = NEW.vendor_id;
    
    -- CRITICAL: Also update profiles.avatar_url for consistency
    UPDATE profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    
    -- Audit log for tracking
    INSERT INTO audit_logs (
      user_id, 
      action, 
      table_name, 
      record_id, 
      new_values
    ) VALUES (
      NEW.vendor_id,
      'AVATAR_UPDATE_SYNC',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'file_url', NEW.file_url,
        'synced_to_vendor_profiles', true,
        'synced_to_profiles', true,
        'updated_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Recreate trigger
CREATE TRIGGER update_vendor_avatar_trigger
AFTER INSERT OR UPDATE ON vendor_documents
FOR EACH ROW
EXECUTE FUNCTION update_vendor_avatar();

-- Step 6: Data migration - sync existing avatars to profiles table
UPDATE profiles p
SET 
  avatar_url = vp.avatar_url,
  updated_at = now()
FROM vendor_profiles vp
WHERE p.id = vp.user_id
  AND vp.avatar_url IS NOT NULL
  AND (p.avatar_url IS NULL OR p.avatar_url != vp.avatar_url);