-- Add missing RLS policies and tighten database security

-- Enable RLS on transactions table if not already enabled
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'transactions' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create comprehensive RLS policies for transactions
CREATE POLICY IF NOT EXISTS "transactions_admin_manage" ON public.transactions
FOR ALL
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY IF NOT EXISTS "transactions_service_role_insert" ON public.transactions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "transactions_service_role_update" ON public.transactions
FOR UPDATE
USING (auth.role() = 'service_role');

-- Update property_inquiries to allow updates for admins
CREATE POLICY IF NOT EXISTS "property_inquiries_admin_update" ON public.property_inquiries
FOR UPDATE
USING (is_admin_user(auth.uid()));

CREATE POLICY IF NOT EXISTS "property_inquiries_admin_delete" ON public.property_inquiries
FOR DELETE
USING (is_admin_user(auth.uid()));

-- Enhance audit_logs security
CREATE POLICY IF NOT EXISTS "audit_logs_service_role_insert" ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Add rate limiting policy for security
CREATE POLICY IF NOT EXISTS "rate_limits_admin_read" ON public.rate_limits
FOR SELECT
USING (is_admin_user(auth.uid()));

-- Create index for better performance on frequently queried tables
CREATE INDEX IF NOT EXISTS idx_properties_status_city ON public.properties(status, city);
CREATE INDEX IF NOT EXISTS idx_projects_status_created_by ON public.projects(status, created_by);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_verified ON public.vendor_profiles(is_verified, subscription_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action);

-- Create function to validate email domains for security
CREATE OR REPLACE FUNCTION public.validate_email_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow common business domains and reject suspicious ones
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND NOT email ~* '\.(tmp|temp|test|example)$'
    AND length(email) <= 254;
END;
$$;