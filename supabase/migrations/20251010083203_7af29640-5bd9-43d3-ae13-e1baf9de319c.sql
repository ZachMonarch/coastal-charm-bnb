-- =====================================================
-- FIX SUPABASE LINTER WARNINGS - RLS PERFORMANCE OPTIMIZATION
-- =====================================================
-- This migration fixes:
-- 1. Auth RLS Initialization Plan warnings (auth_rls_initplan)
-- 2. Multiple Permissive Policies warnings (multiple_permissive_policies)
-- =====================================================

-- =====================================================
-- PART 1: FIX AUTH RLS INIT PLAN ISSUES
-- Replace auth.uid() with (select auth.uid()) for better performance
-- =====================================================

-- Fix properties table - properties_manager_read policy
DROP POLICY IF EXISTS "properties_manager_read" ON public.properties;
CREATE POLICY "properties_manager_read"
ON public.properties
FOR SELECT
TO authenticated
USING (user_has_role((select auth.uid()), 'property_manager'::text));

-- Fix user_roles table - all 4 policies
DROP POLICY IF EXISTS "user_roles_admin_service_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_service_delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  ((select auth.role()) = 'service_role'::text)
);

DROP POLICY IF EXISTS "user_roles_admin_service_only" ON public.user_roles;
CREATE POLICY "user_roles_admin_service_only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user((select auth.uid())) OR 
  ((select auth.role()) = 'service_role'::text)
);

DROP POLICY IF EXISTS "user_roles_admin_service_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_service_update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  ((select auth.role()) = 'service_role'::text)
);

DROP POLICY IF EXISTS "user_roles_read_own_only" ON public.user_roles;
CREATE POLICY "user_roles_read_own_only"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  ((select auth.uid()) = user_id) OR 
  is_admin_user((select auth.uid())) OR 
  ((select auth.role()) = 'service_role'::text)
);

-- Fix vendor_profiles table - vendor_profiles_restricted_public_read policy
DROP POLICY IF EXISTS "vendor_profiles_restricted_public_read" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_restricted_public_read"
ON public.vendor_profiles
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN ((select auth.uid()) = user_id) THEN true
    WHEN is_admin_user((select auth.uid())) THEN true
    WHEN user_has_role((select auth.uid()), 'property_manager'::text) THEN true
    ELSE false
  END
);

-- =====================================================
-- PART 2: CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- Merge multiple permissive policies into single optimized policies
-- =====================================================

-- ============ FIX INVOICES TABLE ============
-- Drop existing permissive policies
DROP POLICY IF EXISTS "invoices_admin_access" ON public.invoices;
DROP POLICY IF EXISTS "invoices_creator_only" ON public.invoices;
DROP POLICY IF EXISTS "invoices_vendor_own" ON public.invoices;

-- Create consolidated policies (single policy per action)
CREATE POLICY "invoices_unified_access"
ON public.invoices
FOR ALL
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid()) OR 
  vendor_id = (select auth.uid())
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid()) OR 
  vendor_id = (select auth.uid())
);

-- ============ FIX MAINTENANCE_REQUESTS TABLE ============
-- Drop existing permissive policies
DROP POLICY IF EXISTS "maintenance_requests_admin_access" ON public.maintenance_requests;
DROP POLICY IF EXISTS "maintenance_requests_tenant_only" ON public.maintenance_requests;

-- Create consolidated policy
CREATE POLICY "maintenance_requests_unified_access"
ON public.maintenance_requests
FOR ALL
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  (select auth.uid()) = tenant_id
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR 
  (select auth.uid()) = tenant_id
);

-- ============ FIX PROJECTS TABLE ============
-- Drop existing permissive policies
DROP POLICY IF EXISTS "projects_admin_manage" ON public.projects;
DROP POLICY IF EXISTS "projects_creator_manage" ON public.projects;
DROP POLICY IF EXISTS "projects_enhanced_access" ON public.projects;

-- Create consolidated policies - separate SELECT from write operations
-- SELECT policy (most permissive - includes vendor viewing open projects)
CREATE POLICY "projects_unified_select"
ON public.projects
FOR SELECT
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid()) OR 
  assigned_vendor_id = (select auth.uid()) OR 
  (status = 'open'::text AND user_has_role((select auth.uid()), 'vendor'::text))
);

-- Write operations policy (admin and creator only)
CREATE POLICY "projects_unified_write"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid())
);

CREATE POLICY "projects_unified_update"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid())
)
WITH CHECK (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid())
);

CREATE POLICY "projects_unified_delete"
ON public.projects
FOR DELETE
TO authenticated
USING (
  is_admin_user((select auth.uid())) OR 
  created_by = (select auth.uid())
);

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify no tables have multiple permissive policies
-- =====================================================
-- SELECT tablename, policyname, permissive, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('invoices', 'maintenance_requests', 'projects', 'properties', 'user_roles', 'vendor_profiles')
-- ORDER BY tablename, cmd, policyname;