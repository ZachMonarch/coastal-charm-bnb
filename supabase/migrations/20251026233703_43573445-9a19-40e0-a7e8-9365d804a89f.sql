-- PHASE 1: Create snapshot and restore real names from auth metadata
CREATE TABLE IF NOT EXISTS profiles_snapshot_20251026_corrupted AS
SELECT * FROM profiles WHERE full_name = 'Hacker';

-- Restore real names from auth.users metadata or email fallback
UPDATE profiles
SET 
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' 
     FROM auth.users 
     WHERE auth.users.id = profiles.id),
    (SELECT raw_user_meta_data->>'name' 
     FROM auth.users 
     WHERE auth.users.id = profiles.id),
    split_part(profiles.email, '@', 1)
  ),
  updated_at = NOW()
WHERE full_name = 'Hacker';

-- PHASE 2: Create audit infrastructure
CREATE TABLE IF NOT EXISTS profile_name_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_name TEXT,
  new_name TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE profile_name_audit ENABLE ROW LEVEL SECURITY;

-- Admin-only access to audit logs
CREATE POLICY profile_name_audit_admin_only ON profile_name_audit
FOR ALL USING (is_admin_user(auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profile_name_audit_profile_id ON profile_name_audit(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_name_audit_changed_at ON profile_name_audit(changed_at DESC);

-- PHASE 3: Create trigger to log all name changes
CREATE OR REPLACE FUNCTION audit_profile_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    INSERT INTO profile_name_audit (profile_id, old_name, new_name, changed_by, change_reason)
    VALUES (
      NEW.id, 
      OLD.full_name, 
      NEW.full_name, 
      auth.uid(),
      CASE 
        WHEN NEW.full_name ~* '^(hacker|test|placeholder|unknown|null)$' 
        THEN 'SUSPICIOUS_NAME_CHANGE'
        ELSE 'USER_UPDATE'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_name_change_audit ON profiles;
CREATE TRIGGER profile_name_change_audit
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_name_change();

-- PHASE 4: Add constraint to block placeholder names
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS full_name_not_placeholder;

ALTER TABLE profiles
ADD CONSTRAINT full_name_not_placeholder
CHECK (full_name !~* '^(hacker|test|placeholder|unknown|null|admin|root|system)$');

-- PHASE 5: Log restoration in audit_logs
INSERT INTO audit_logs (action, table_name, record_id, user_id, new_values)
SELECT 
  'BULK_NAME_RESTORATION',
  'profiles',
  id::text,
  id,
  jsonb_build_object(
    'restored_from', 'Hacker',
    'restored_to', full_name,
    'restoration_date', NOW(),
    'incident_reference', 'INCIDENT_20251026_FINAL_FIX'
  )
FROM profiles
WHERE id IN (SELECT id FROM profiles_snapshot_20251026_corrupted);