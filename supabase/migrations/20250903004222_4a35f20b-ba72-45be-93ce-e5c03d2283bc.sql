-- Make user image storage buckets private for better security
-- Update profile-avatars and profile-photos buckets to be private

UPDATE storage.buckets 
SET public = false 
WHERE id IN ('profile-avatars', 'profile-photos');

-- Create signed URL helper function for secure image access
CREATE OR REPLACE FUNCTION public.get_profile_image_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
) 
RETURNS TEXT
SECURITY DEFINER
SET search_path = public, storage
LANGUAGE plpgsql
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Only allow access to own profile images or if admin
  IF NOT (
    file_path LIKE (auth.uid()::TEXT || '/%') OR 
    is_admin_user(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to profile image';
  END IF;

  -- Generate signed URL (this would need to be implemented with actual Supabase signed URL generation)
  -- For now, return the file path - in production this would generate a proper signed URL
  RETURN '/storage/v1/object/sign/' || bucket_name || '/' || file_path;
END;
$$;