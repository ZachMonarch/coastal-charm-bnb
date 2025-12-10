-- Fix audit_logs INSERT policy to prevent NULL user_id entries and restrict access
DROP POLICY IF EXISTS audit_logs_auth_insert ON audit_logs;

-- Create restricted INSERT policy that:
-- 1. Allows admins to insert any logs
-- 2. Allows service_role to insert any logs (for system-generated logs)
-- 3. Allows authenticated users to insert ONLY logs with their own non-null user_id
CREATE POLICY audit_logs_restricted_insert ON audit_logs
  FOR INSERT
  WITH CHECK (
    is_admin_user(auth.uid()) OR 
    auth.role() = 'service_role' OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND user_id IS NOT NULL)
  );

-- Add comment for documentation
COMMENT ON POLICY audit_logs_restricted_insert ON audit_logs IS 'Restricts audit log inserts: admins and service_role can insert freely, regular users can only insert logs with their own non-null user_id';