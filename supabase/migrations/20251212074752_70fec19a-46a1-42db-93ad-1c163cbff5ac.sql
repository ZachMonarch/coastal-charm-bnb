-- Add service_role access to audit_logs for emergency access
CREATE POLICY "audit_logs_select_service" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'service_role');