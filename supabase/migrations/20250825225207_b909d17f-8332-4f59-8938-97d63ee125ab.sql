-- FINAL SECURITY FIX: Address remaining RLS vulnerabilities

-- Fix remaining security issues identified by scanner

-- 1. Add additional constraints to audit_logs RLS
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins only audit access" ON public.audit_logs
  FOR SELECT
  USING (is_admin_user(auth.uid()) AND auth.uid() IS NOT NULL);

-- 2. Ensure rate_limits is completely locked down
DROP POLICY IF EXISTS "System processes can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role only rate limits" ON public.rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Fix vendor_applications to be more restrictive
DROP POLICY IF EXISTS "Admins can view all applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.vendor_applications;

CREATE POLICY "Application owners only" ON public.vendor_applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access applications" ON public.vendor_applications
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- 4. Strengthen user_roles security
DROP POLICY IF EXISTS "Users can view own roles only" ON public.user_roles;
CREATE POLICY "Auth users view own roles" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- 5. Add final security layer for properties
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
CREATE POLICY "Limited property access" ON public.properties
  FOR SELECT
  USING (
    -- Property owners
    auth.uid()::text = owner_id 
    OR 
    -- Admins
    is_admin_user(auth.uid())
    OR
    -- Property managers for specific properties they manage
    user_has_role(auth.uid(), 'property_manager')
  );

-- Add security audit for all table access
CREATE OR REPLACE FUNCTION log_table_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to sensitive tables
  IF TG_TABLE_NAME IN ('user_roles', 'audit_logs', 'vendor_applications', 'rate_limits') THEN
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, new_values, created_at
    ) VALUES (
      auth.uid(),
      'TABLE_ACCESS: ' || TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      jsonb_build_object(
        'operation', TG_OP,
        'timestamp', now(),
        'user_role', (SELECT role FROM profiles WHERE id = auth.uid())
      ),
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply access logging to critical tables
CREATE TRIGGER log_user_roles_access
  AFTER SELECT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_table_access();

CREATE TRIGGER log_vendor_applications_access
  AFTER SELECT ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION log_table_access();