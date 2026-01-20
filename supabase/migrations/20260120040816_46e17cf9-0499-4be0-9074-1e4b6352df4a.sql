-- Security Fix: Tighten RLS policies for profiles and audit_logs tables
-- Issue 1: profiles_table_public_exposure - Restrict profile access to owner + admins only
-- Issue 2: audit_logs_tenant_exposure - Restrict audit logs to super-admins only

-- ============================================================
-- FIX 1: Profiles table - Only owner and admins can view full profile
-- ============================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Create restrictive SELECT policy: only owner or admin can view profile
CREATE POLICY "profiles_owner_or_admin_select"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  -- Owner can see own profile
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Ensure INSERT policy exists for user creating own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ensure UPDATE policy: only owner can update their profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================
-- FIX 2: Audit logs - Restrict to super-admins only (protected_admins)
-- ============================================================

-- Drop existing tenant-wide admin policy
DROP POLICY IF EXISTS "audit_logs_tenant_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view tenant audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;

-- Create strict super-admin only policy using protected_admins table
CREATE POLICY "audit_logs_super_admin_only"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.protected_admins pa
    WHERE pa.user_id = auth.uid()
  )
);

-- Ensure audit_logs INSERT is system-only (via triggers/functions)
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_system_insert"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  -- Only allow insert via SECURITY DEFINER functions (service role)
  -- or if user is a protected admin
  EXISTS (
    SELECT 1 FROM public.protected_admins pa
    WHERE pa.user_id = auth.uid()
  )
);

-- Ensure no UPDATE or DELETE on audit logs (immutability)
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;

-- Explicitly deny updates and deletes by creating policies that never match
CREATE POLICY "audit_logs_no_update"
ON public.audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "audit_logs_no_delete"
ON public.audit_logs
FOR DELETE
USING (false);