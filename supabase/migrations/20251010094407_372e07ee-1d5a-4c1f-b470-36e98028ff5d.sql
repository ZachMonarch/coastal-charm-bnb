-- Fix avatar sync trigger to update both vendor_profiles and profiles tables
-- This ensures avatar displays correctly across all components

CREATE OR REPLACE FUNCTION public.update_vendor_avatar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.document_type IN ('logo', 'profile_image') THEN
    -- Update vendor_profiles.avatar_url (primary source for vendors)
    UPDATE vendor_profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE user_id = NEW.vendor_id;
    
    -- Also update profiles.avatar_url for consistency across all user types
    UPDATE profiles 
    SET 
      avatar_url = NEW.file_url,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    
    -- Audit log
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
        'updated_at', now(),
        'synced_to_profiles', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;