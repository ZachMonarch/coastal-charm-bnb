-- Fix: Make audit_logs fully immutable by blocking ALL updates
-- This ensures audit trail integrity even if admin account is compromised

-- Drop existing UPDATE policy that allows admins to update
DROP POLICY IF EXISTS "audit_logs_unified_update" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_update" ON public.audit_logs;

-- Create a policy that blocks ALL updates (returns false for everyone)
CREATE POLICY "audit_logs_immutable_no_update" ON public.audit_logs
FOR UPDATE USING (false);

-- Also block DELETE operations for complete immutability
DROP POLICY IF EXISTS "audit_logs_unified_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_immutable_no_delete" ON public.audit_logs
FOR DELETE USING (false);

-- Similarly make security_events immutable
DROP POLICY IF EXISTS "security_events_unified_update" ON public.security_events;
DROP POLICY IF EXISTS "Admins can update security events" ON public.security_events;
CREATE POLICY "security_events_immutable_no_update" ON public.security_events
FOR UPDATE USING (false);

DROP POLICY IF EXISTS "security_events_unified_delete" ON public.security_events;
CREATE POLICY "security_events_immutable_no_delete" ON public.security_events
FOR DELETE USING (false);