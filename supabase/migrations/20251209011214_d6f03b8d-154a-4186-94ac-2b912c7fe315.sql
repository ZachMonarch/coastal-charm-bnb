-- Clean up redundant RLS policies
-- These policies are duplicates of the immutable policies added in migration 20251208075753

-- Drop redundant DELETE policy on audit_logs (covered by audit_logs_immutable_no_delete)
DROP POLICY IF EXISTS "audit_logs_prevent_delete" ON public.audit_logs;

-- Drop redundant DELETE policy on security_events (covered by security_events_immutable_no_delete)
DROP POLICY IF EXISTS "security_events_prevent_delete" ON public.security_events;

-- Drop dead UPDATE policy on security_events (blocked by security_events_immutable_no_update anyway)
DROP POLICY IF EXISTS "security_events_admin_only_update" ON public.security_events;