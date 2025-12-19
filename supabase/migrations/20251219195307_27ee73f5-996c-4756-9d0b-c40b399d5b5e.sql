-- Phase 1: Drop overly permissive RLS policies on properties table
DROP POLICY IF EXISTS "properties_public_listings" ON properties;
DROP POLICY IF EXISTS "Public can view property listings safely" ON properties;
DROP POLICY IF EXISTS "properties_select_available" ON properties;

-- Phase 2: Harden audit_logs with explicit user isolation policy
DROP POLICY IF EXISTS "audit_logs_user_isolation" ON audit_logs;
CREATE POLICY "audit_logs_user_isolation" ON audit_logs
FOR SELECT TO authenticated
USING (
  is_admin_user(auth.uid()) 
  OR user_id = auth.uid()
);

-- Verify remaining policies are secure
COMMENT ON TABLE properties IS 'Properties table - public access restricted to safe_property_listings view only';