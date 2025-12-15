-- Fix audit_logs security: Block direct inserts, enforce function-based insertion
-- Create a secure INSERT policy that blocks ALL direct client inserts
-- Only the SECURITY DEFINER function (or service_role) can insert
CREATE POLICY "audit_logs_secure_insert"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  -- Only allow inserts from service_role context (edge functions, triggers)
  -- This is more secure than checking current_setting which can fail silently
  (SELECT current_user) = 'postgres' 
  OR (SELECT current_user) = 'service_role'
  OR auth.role() = 'service_role'
);

-- Drop the old vulnerable policy
DROP POLICY IF EXISTS "audit_logs_service_only_insert" ON public.audit_logs;