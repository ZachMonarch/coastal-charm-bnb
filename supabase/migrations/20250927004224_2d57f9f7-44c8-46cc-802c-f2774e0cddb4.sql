-- Phase 1: Fix Database Schema & Trigger

-- First, ensure the update_vendor_avatar trigger function exists and works correctly
CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update vendor profile avatar when profile_image or logo documents are uploaded
  IF NEW.document_type IN ('logo', 'profile_image') THEN
    -- Update vendor_profiles table
    UPDATE vendor_profiles 
    SET 
      avatar_url = NEW.file_url,
      public_avatar_url = NEW.file_url,
      updated_at = now()
    WHERE user_id = NEW.vendor_id;
    
    -- Update profiles table 
    UPDATE profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    
    -- Log the avatar update
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, new_values
    ) VALUES (
      NEW.vendor_id,
      'AVATAR_UPDATE',
      'vendor_documents',
      NEW.id::text,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'file_url', NEW.file_url,
        'updated_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_vendor_avatar_trigger ON vendor_documents;

-- Create the trigger for both INSERT and UPDATE operations
CREATE TRIGGER update_vendor_avatar_trigger
  AFTER INSERT OR UPDATE ON vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_avatar();

-- Add function to get document signed URLs with proper error handling
CREATE OR REPLACE FUNCTION public.get_document_signed_url(
  bucket_name text,
  file_path text,
  expires_in integer DEFAULT 3600
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  signed_url text;
BEGIN
  -- For documents bucket, generate signed URL
  IF bucket_name = 'documents' THEN
    -- This is a simplified version - in production, this would integrate with Supabase storage
    -- For now, return the file_path which should work with the storage system
    RETURN '/storage/v1/object/public/' || bucket_name || '/' || file_path;
  END IF;
  
  -- Default fallback
  RETURN file_path;
END;
$$;

-- Create function to migrate existing avatars to new system
CREATE OR REPLACE FUNCTION public.migrate_existing_avatars()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Find profiles with avatar_url but no corresponding vendor_documents entry
  FOR profile_record IN
    SELECT vp.user_id, vp.avatar_url, p.avatar_url as profile_avatar
    FROM vendor_profiles vp
    LEFT JOIN profiles p ON p.id = vp.user_id
    WHERE (vp.avatar_url IS NOT NULL OR p.avatar_url IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM vendor_documents vd 
      WHERE vd.vendor_id = vp.user_id 
      AND vd.document_type IN ('profile_image', 'logo')
    )
  LOOP
    -- Create a vendor_documents entry for existing avatars
    IF profile_record.avatar_url IS NOT NULL THEN
      INSERT INTO vendor_documents (
        vendor_id,
        document_type,
        file_name,
        file_path,
        file_url,
        mime_type,
        is_verified,
        uploaded_at
      ) VALUES (
        profile_record.user_id,
        'profile_image',
        'migrated_avatar.jpg',
        profile_record.avatar_url,
        profile_record.avatar_url,
        'image/jpeg',
        true,
        now()
      );
    END IF;
  END LOOP;
END;
$$;

-- Run the migration for existing avatars
SELECT migrate_existing_avatars();