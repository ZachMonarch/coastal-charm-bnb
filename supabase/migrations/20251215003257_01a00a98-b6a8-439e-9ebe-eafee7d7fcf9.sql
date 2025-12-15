-- =====================================================
-- FIX: Remove admin INSERT policy on audit_logs
-- Audit logs should ONLY be written by service_role (triggers)
-- This prevents potential audit trail tampering
-- =====================================================

-- Drop the vulnerable policy that allows admins to insert
DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;

-- Verify the service_role insert policy exists (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'audit_logs_service_only_insert'
  ) THEN
    CREATE POLICY "audit_logs_service_only_insert" 
    ON public.audit_logs 
    FOR INSERT 
    WITH CHECK (current_setting('role', true) = 'service_role');
  END IF;
END $$;

-- Add comment documenting security rationale
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail. INSERT only via service_role (triggers). No user-level INSERT/UPDATE/DELETE allowed.';