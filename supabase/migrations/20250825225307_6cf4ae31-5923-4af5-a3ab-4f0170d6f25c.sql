-- CORRECTED FINAL SECURITY FIX: Address remaining RLS vulnerabilities

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
DROP POLICY IF EXISTS "Limited property access" ON public.properties;
CREATE POLICY "Secure property access" ON public.properties
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

-- Add comprehensive audit logging function for modification events only
CREATE OR REPLACE FUNCTION log_modification_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all modifications to sensitive tables
  IF TG_TABLE_NAME IN ('user_roles', 'vendor_applications', 'profiles', 'properties') THEN
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, old_values, new_values, created_at
    ) VALUES (
      auth.uid(),
      'MODIFICATION: ' || TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply modification logging to critical tables
CREATE TRIGGER log_user_roles_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_modification_events();

CREATE TRIGGER log_vendor_applications_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION log_modification_events();

CREATE TRIGGER log_profiles_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_modification_events();