-- Phase 1: Critical Security Fixes Migration
-- ===========================================

-- 1. Fix security_dashboard view to use SECURITY INVOKER
-- This prevents privilege escalation through views
DROP VIEW IF EXISTS security_dashboard CASCADE;

CREATE VIEW security_dashboard
WITH (security_invoker=on)
AS
SELECT 
  event_type,
  severity,
  COUNT(*) AS event_count,
  MAX(created_at) AS last_occurrence,
  COUNT(DISTINCT user_id) AS affected_users
FROM security_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  COUNT(*) DESC;

-- 2. Update critical security functions with proper search_path
-- This prevents search_path hijacking attacks

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'admin'
  );
$$;

-- Fix user_has_role function
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = user_uuid 
    AND ur.role = role_name
  );
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 3. Consolidate duplicate RLS policies on properties table
-- Remove redundant policies
DROP POLICY IF EXISTS "properties_admin_only_read" ON properties;
DROP POLICY IF EXISTS "properties_role_based_access" ON properties;

-- Keep only the comprehensive access policy
-- The "properties_admin_full_access" policy already exists and handles admin writes

-- 4. Consolidate duplicate RLS policies on profiles table  
-- Remove redundant admin read-only policy (admin_read_only is redundant with admin full access)
DROP POLICY IF EXISTS "profiles_admin_read_only" ON profiles;

-- The "profiles_own_only" policy already handles user access appropriately

-- 5. Tighten bookings table RLS to prevent guest data exposure
-- Update existing policy to ensure users can only see their own bookings
DROP POLICY IF EXISTS "bookings_own_only" ON bookings;
DROP POLICY IF EXISTS "bookings_admin_access" ON bookings;

-- Recreate with stricter controls
CREATE POLICY "bookings_user_own_only" ON bookings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_admin_full_access" ON bookings
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- 6. Fix audit_logs to prevent data leakage
-- Update policies to ensure only admins and service role can access
DROP POLICY IF EXISTS "audit_logs_admin_only_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_only_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_only_delete" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_service_insert" ON audit_logs;

-- Recreate with tighter controls
CREATE POLICY "audit_logs_admin_select" ON audit_logs
FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "audit_logs_service_insert" ON audit_logs
FOR INSERT
TO authenticated, service_role
WITH CHECK (is_admin_user(auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "audit_logs_admin_update" ON audit_logs
FOR UPDATE
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "audit_logs_admin_delete" ON audit_logs
FOR DELETE
TO authenticated
USING (is_admin_user(auth.uid()));

-- 7. Add index for performance on security_events
CREATE INDEX IF NOT EXISTS idx_security_events_created_at 
ON security_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
ON security_events(user_id) 
WHERE user_id IS NOT NULL;

-- 8. Add index for performance on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id) 
WHERE user_id IS NOT NULL;