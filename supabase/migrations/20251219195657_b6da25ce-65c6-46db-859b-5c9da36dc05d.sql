-- Fix audit_logs NULL user_id issue: ensure admins can see NULL entries but regular users cannot
DROP POLICY IF EXISTS "audit_logs_user_isolation" ON audit_logs;

CREATE POLICY "audit_logs_user_isolation" ON audit_logs
FOR SELECT TO authenticated
USING (
  is_admin_user(auth.uid()) 
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- Add comment explaining the policy
COMMENT ON POLICY "audit_logs_user_isolation" ON audit_logs IS 
'Users can only see their own audit logs (user_id must match). Admins can see all logs including system entries (NULL user_id).';