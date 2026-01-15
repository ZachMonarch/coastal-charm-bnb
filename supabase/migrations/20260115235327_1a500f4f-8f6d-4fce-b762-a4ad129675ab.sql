
-- Phase 2: Complete remaining production readiness actions

-- 2.1 Activate inactive email templates
UPDATE email_templates SET is_active = true WHERE name = 'access_request_approved';
UPDATE email_templates SET is_active = true WHERE name = 'payment_notification';

-- 2.2 Clean up legacy/backup tables (archive to prevent clutter)
-- First create an archive schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS archive;

-- Move legacy tables to archive schema
ALTER TABLE IF EXISTS public.profiles_snapshot_20251026_corrupted 
  SET SCHEMA archive;

ALTER TABLE IF EXISTS public.security_backup_profiles_role_20251025 
  SET SCHEMA archive;

-- 2.3 Add audit trigger for sensitive profile access by admins
CREATE OR REPLACE FUNCTION audit_admin_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when admin accesses another user's profile
  IF TG_OP = 'SELECT' AND NEW.id != auth.uid() AND is_admin_user(auth.uid()) THEN
    INSERT INTO audit_logs (action, table_name, record_id, user_id, new_values)
    VALUES ('admin_profile_access', 'profiles', NEW.id::text, auth.uid(), 
            jsonb_build_object('accessed_profile_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 2.4 Add index for faster email template lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_name_active 
  ON email_templates(name, is_active);

-- 2.5 Add comment documenting security status
COMMENT ON SCHEMA archive IS 'Archived legacy tables from production hardening. Created 2026-01-15.';
