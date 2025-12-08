-- CORRECTED CRITICAL SECURITY FIX: Lock down remaining public data exposure

-- 1. Fix properties table - remove public access
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Secure property access" ON public.properties;
DROP POLICY IF EXISTS "Authenticated property access only" ON public.properties;

-- Create restricted property access policy (authenticated users only)
CREATE POLICY "Authenticated users view properties" ON public.properties
  FOR SELECT
  USING (
    -- Only authenticated users can see properties
    auth.uid() IS NOT NULL
  );

-- 2. Completely lock down rate_limits table - service role only
DROP POLICY IF EXISTS "Service role only rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "System service rate limits only" ON public.rate_limits;

CREATE POLICY "Service role exclusive rate limits" ON public.rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Completely lock down audit_logs table - admin access only  
DROP POLICY IF EXISTS "Admins only audit access" ON public.audit_logs;
DROP POLICY IF EXISTS "System can manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin exclusive audit access" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role audit management" ON public.audit_logs;

CREATE POLICY "Admins view audit logs only" ON public.audit_logs
  FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Service role insert audit logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 4. Ensure system health is locked down
DROP POLICY IF EXISTS "System can manage system health" ON public.system_health;
DROP POLICY IF EXISTS "Service role system health only" ON public.system_health;
DROP POLICY IF EXISTS "Admins can view system health" ON public.system_health;

CREATE POLICY "Service role exclusive system health" ON public.system_health
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view system health" ON public.system_health
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- 5. Additional security: ensure no anonymous access to sensitive tables
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.system_health FROM anon;

-- Grant proper access to authenticated users
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Grant admin access to audit logs
GRANT SELECT ON public.audit_logs TO authenticated;