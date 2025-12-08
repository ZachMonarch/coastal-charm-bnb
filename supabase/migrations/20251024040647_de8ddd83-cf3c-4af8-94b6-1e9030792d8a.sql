-- PHASE 2: Avatar Sync & Image Optimization
-- Ensure avatar sync trigger exists and works correctly

-- Verify and recreate the avatar sync trigger
DROP TRIGGER IF EXISTS sync_vendor_avatar_trigger ON vendor_documents;

CREATE TRIGGER sync_vendor_avatar_trigger
AFTER INSERT OR UPDATE ON vendor_documents
FOR EACH ROW
WHEN (NEW.document_type IN ('logo', 'profile_image'))
EXECUTE FUNCTION update_vendor_avatar();

-- Manual sync for any existing avatars that may be out of sync
-- This ensures vendor_documents -> vendor_profiles -> profiles all have consistent avatars
WITH latest_avatars AS (
  SELECT DISTINCT ON (vendor_id)
    vendor_id,
    file_url
  FROM vendor_documents
  WHERE document_type IN ('logo', 'profile_image')
    AND file_url IS NOT NULL
    AND file_url != ''
  ORDER BY vendor_id, uploaded_at DESC
)
UPDATE vendor_profiles vp
SET 
  avatar_url = la.file_url,
  public_avatar_url = la.file_url,
  updated_at = NOW()
FROM latest_avatars la
WHERE vp.user_id = la.vendor_id
  AND (vp.avatar_url IS NULL OR vp.avatar_url != la.file_url OR vp.avatar_url = '');

-- Also sync to profiles table for UI consistency
UPDATE profiles p
SET 
  avatar_url = vp.avatar_url,
  updated_at = NOW()
FROM vendor_profiles vp
WHERE p.id = vp.user_id
  AND vp.avatar_url IS NOT NULL
  AND vp.avatar_url != ''
  AND (p.avatar_url IS NULL OR p.avatar_url != vp.avatar_url OR p.avatar_url = '');

-- Log the sync operation
INSERT INTO audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  (SELECT auth.uid()),
  'AVATAR_SYNC_PHASE_2',
  'vendor_documents',
  'phase_2_migration',
  jsonb_build_object(
    'timestamp', NOW(),
    'trigger_recreated', true,
    'manual_sync_executed', true,
    'tables_synced', jsonb_build_array(
      'vendor_documents',
      'vendor_profiles',
      'profiles'
    )
  )
);