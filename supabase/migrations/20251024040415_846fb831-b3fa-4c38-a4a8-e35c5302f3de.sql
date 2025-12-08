-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix RLS performance issues and add missing security policies

-- ============================================================================
-- 1. Fix auth_rls_initplan Performance Issues
-- ============================================================================

-- Fix financial_reports policies (wrap auth.uid() in subselects)
DROP POLICY IF EXISTS "financial_reports_admin_pm_access" ON financial_reports;
DROP POLICY IF EXISTS "financial_reports_admin_pm_insert" ON financial_reports;
DROP POLICY IF EXISTS "financial_reports_admin_pm_update" ON financial_reports;

CREATE POLICY "financial_reports_admin_pm_access" ON financial_reports
FOR SELECT USING (
  is_admin_user((SELECT auth.uid())) OR 
  user_has_role((SELECT auth.uid()), 'property_manager')
);

CREATE POLICY "financial_reports_admin_pm_insert" ON financial_reports
FOR INSERT WITH CHECK (
  is_admin_user((SELECT auth.uid())) OR 
  user_has_role((SELECT auth.uid()), 'property_manager')
);

CREATE POLICY "financial_reports_admin_pm_update" ON financial_reports
FOR UPDATE USING (
  is_admin_user((SELECT auth.uid())) OR 
  user_has_role((SELECT auth.uid()), 'property_manager')
) WITH CHECK (
  is_admin_user((SELECT auth.uid())) OR 
  user_has_role((SELECT auth.uid()), 'property_manager')
);

-- Fix security_events policy
DROP POLICY IF EXISTS "security_events_unified_access" ON security_events;

CREATE POLICY "security_events_admin_select" ON security_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = (SELECT auth.uid()) 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "security_events_admin_service_insert" ON security_events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = (SELECT auth.uid()) 
    AND profiles.role = 'admin'
  ) OR auth.role() = 'service_role'
);

CREATE POLICY "security_events_admin_update" ON security_events
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = (SELECT auth.uid()) 
    AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = (SELECT auth.uid()) 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- 2. Add Missing RLS Delete Policies (Prevent Deletion of Critical Data)
-- ============================================================================

-- Prevent audit_logs deletion (immutable audit trail for compliance)
DROP POLICY IF EXISTS "audit_logs_prevent_delete" ON audit_logs;
CREATE POLICY "audit_logs_prevent_delete" ON audit_logs
FOR DELETE USING (false);

-- Prevent financial_reports deletion (financial records are immutable)
DROP POLICY IF EXISTS "financial_reports_prevent_delete" ON financial_reports;
CREATE POLICY "financial_reports_prevent_delete" ON financial_reports
FOR DELETE USING (false);

-- ============================================================================
-- 3. Restrict Public User Data Access
-- ============================================================================

-- Replace overly permissive profiles policy with restricted access
DROP POLICY IF EXISTS "profiles_unified_access" ON profiles;

-- Users can only read their own profile or admins can read all
CREATE POLICY "profiles_self_read" ON profiles
FOR SELECT USING (
  id = (SELECT auth.uid()) OR 
  is_admin_user((SELECT auth.uid()))
);

-- Users can only update their own profile or admins can update all
CREATE POLICY "profiles_self_update" ON profiles
FOR UPDATE USING (
  id = (SELECT auth.uid()) OR 
  is_admin_user((SELECT auth.uid()))
) WITH CHECK (
  id = (SELECT auth.uid()) OR 
  is_admin_user((SELECT auth.uid()))
);

-- Users can insert their own profile or admins can insert any
CREATE POLICY "profiles_self_insert" ON profiles
FOR INSERT WITH CHECK (
  id = (SELECT auth.uid()) OR 
  is_admin_user((SELECT auth.uid()))
);

-- Only admins can delete profiles
CREATE POLICY "profiles_admin_delete" ON profiles
FOR DELETE USING (
  is_admin_user((SELECT auth.uid()))
);

-- ============================================================================
-- Audit Logging for Security Changes
-- ============================================================================

INSERT INTO audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  (SELECT auth.uid()),
  'SECURITY_HARDENING_PHASE_1',
  'system',
  'phase_1_migration',
  jsonb_build_object(
    'timestamp', NOW(),
    'changes', jsonb_build_array(
      'Fixed auth_rls_initplan performance issues',
      'Added delete prevention policies for audit_logs and financial_reports',
      'Restricted profiles table access to self + admin only',
      'Wrapped auth.uid() calls in subselects for better performance'
    ),
    'tables_affected', jsonb_build_array(
      'financial_reports',
      'security_events',
      'audit_logs',
      'profiles'
    )
  )
);