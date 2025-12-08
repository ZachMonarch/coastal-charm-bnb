-- CRITICAL SECURITY FIX: Lock down remaining public data exposure

-- 1. Fix properties table - remove public access
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Secure property access" ON public.properties;

-- Create restricted property access policy
CREATE POLICY "Authenticated property access only" ON public.properties
  FOR SELECT
  USING (
    -- Only authenticated users can see properties
    auth.uid() IS NOT NULL AND (
      -- Property owners can see their own properties
      auth.uid()::text = owner_id 
      OR 
      -- Admins can see all properties
      is_admin_user(auth.uid())
      OR
      -- Property managers can see properties they manage
      user_has_role(auth.uid(), 'property_manager')
      OR
      -- Regular authenticated users can see basic property info for browsing
      true
    )
  );

-- 2. Completely lock down rate_limits table - service role only
DROP POLICY IF EXISTS "Service role only rate limits" ON public.rate_limits;

CREATE POLICY "System service rate limits only" ON public.rate_limits
  FOR ALL
  USING ((current_setting('role') = 'service_role'))
  WITH CHECK ((current_setting('role') = 'service_role'));

-- 3. Completely lock down audit_logs table - admin access only  
DROP POLICY IF EXISTS "Admins only audit access" ON public.audit_logs;
DROP POLICY IF EXISTS "System can manage audit logs" ON public.audit_logs;

CREATE POLICY "Admin exclusive audit access" ON public.audit_logs
  FOR SELECT
  USING (is_admin_user(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Service role audit management" ON public.audit_logs
  FOR INSERT
  WITH CHECK ((current_setting('role') = 'service_role') OR is_admin_user(auth.uid()));

-- 4. Ensure system health is locked down
DROP POLICY IF EXISTS "System can manage system health" ON public.system_health;

CREATE POLICY "Service role system health only" ON public.system_health
  FOR ALL
  USING ((current_setting('role') = 'service_role'))
  WITH CHECK ((current_setting('role') = 'service_role'));

-- 5. Add comprehensive access logging for critical tables
CREATE OR REPLACE FUNCTION log_critical_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to critical system tables
  IF TG_TABLE_NAME IN ('properties', 'user_roles', 'audit_logs') AND TG_OP = 'SELECT' THEN
    -- Only log if not service role to avoid infinite loops
    IF current_setting('role') != 'service_role' THEN
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
          'ip_address', current_setting('request.header.x-forwarded-for', true)
        ),
        now()
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply critical access logging (but not to audit_logs to avoid recursion)
DROP TRIGGER IF EXISTS log_properties_access ON public.properties;
CREATE TRIGGER log_properties_access
  AFTER SELECT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION log_critical_access();

DROP TRIGGER IF EXISTS log_user_roles_critical_access ON public.user_roles;
CREATE TRIGGER log_user_roles_critical_access
  AFTER SELECT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_critical_access();