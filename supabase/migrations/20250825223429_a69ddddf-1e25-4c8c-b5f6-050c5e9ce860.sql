-- COMPREHENSIVE SECURITY FIX: Address all remaining vulnerabilities

-- 1. Fix public property data exposure
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Remove existing overly permissive policy
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;

-- Create secure policies for properties
CREATE POLICY "Authenticated users can view properties" ON public.properties
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Property owners can manage their properties" ON public.properties
  FOR ALL
  USING (auth.uid()::text = owner_id)
  WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- 2. Fix audit logs exposure - remove public access
DROP POLICY IF EXISTS "System service can manage audit logs" ON public.audit_logs;

-- Secure audit logs - admin and system only
CREATE POLICY "System can manage audit logs" ON public.audit_logs
  FOR ALL
  USING (current_user = 'supabase_admin' OR current_user = 'service_role')
  WITH CHECK (current_user = 'supabase_admin' OR current_user = 'service_role');

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- 3. Fix rate limits exposure - system only
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

CREATE POLICY "System processes can manage rate limits" ON public.rate_limits
  FOR ALL
  USING (current_user = 'supabase_admin' OR current_user = 'service_role')
  WITH CHECK (current_user = 'supabase_admin' OR current_user = 'service_role');

-- 4. Fix vendor applications - secure access
DROP POLICY IF EXISTS "Users can view all vendor applications" ON public.vendor_applications;

CREATE POLICY "Users can view their own applications" ON public.vendor_applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.vendor_applications
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- 5. Fix projects table - secure access
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;

CREATE POLICY "Project creators can view their projects" ON public.projects
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Assigned vendors can view their projects" ON public.projects
  FOR SELECT
  USING (auth.uid() = assigned_vendor_id);

CREATE POLICY "Property managers can view projects" ON public.projects
  FOR SELECT
  USING (user_has_role(auth.uid(), 'property_manager') OR is_admin_user(auth.uid()));

-- 6. Fix user_roles - secure access patterns
DROP POLICY IF EXISTS "Users can view all roles for role checking" ON public.user_roles;

CREATE POLICY "Users can view own roles only" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Add comprehensive audit logging for sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME IN ('profiles', 'user_roles', 'vendor_profiles', 'transactions') THEN
    PERFORM log_security_event(
      'SENSITIVE_ACCESS',
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      jsonb_build_object(
        'operation', TG_OP,
        'user_id', auth.uid(),
        'timestamp', now(),
        'table', TG_TABLE_NAME
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply comprehensive security audit triggers
DROP TRIGGER IF EXISTS sensitive_access_profiles ON public.profiles;
CREATE TRIGGER sensitive_access_profiles
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();

DROP TRIGGER IF EXISTS sensitive_access_user_roles ON public.user_roles;
CREATE TRIGGER sensitive_access_user_roles
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();