-- =====================================================
-- PHASE 1 COMPLETION: Security & Performance Fixes
-- =====================================================

-- 1️⃣ FIX FUNCTION SEARCH_PATH (Security)
-- Problem: is_admin_user has mutable search_path
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = user_uuid
      AND ur.role = 'admin'
  );
$$;

-- Also fix the no-arg version
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());

  RETURN user_role = 'admin';
END;
$$;

-- Fix user_has_role function
CREATE OR REPLACE FUNCTION public.user_has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());

  RETURN user_role = role_name OR user_role = 'admin';
END;
$$;

-- 2️⃣ OPTIMIZE RLS POLICIES (Performance)
-- Replace auth.uid() calls with subquery form for better performance

-- security_events policies
DROP POLICY IF EXISTS "security_events_admin_select" ON public.security_events;
DROP POLICY IF EXISTS "security_events_admin_service_insert" ON public.security_events;
DROP POLICY IF EXISTS "security_events_admin_update" ON public.security_events;

CREATE POLICY "security_events_admin_select" ON public.security_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "security_events_admin_service_insert" ON public.security_events
FOR INSERT
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  ) OR (
    (SELECT auth.role()) = 'service_role'
  )
);

CREATE POLICY "security_events_admin_update" ON public.security_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- vendor_documents policies (optimized)
DROP POLICY IF EXISTS "vendor_documents_select_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_insert_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_update_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_delete_policy" ON public.vendor_documents;

CREATE POLICY "vendor_documents_select_policy" ON public.vendor_documents
FOR SELECT
USING (
  vendor_id = (SELECT auth.uid())
  OR user_has_role('admin')
  OR user_has_role('property_manager')
);

CREATE POLICY "vendor_documents_insert_policy" ON public.vendor_documents
FOR INSERT
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  OR user_has_role('admin')
);

CREATE POLICY "vendor_documents_update_policy" ON public.vendor_documents
FOR UPDATE
USING (
  vendor_id = (SELECT auth.uid())
  OR user_has_role('admin')
)
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  OR user_has_role('admin')
);

CREATE POLICY "vendor_documents_delete_policy" ON public.vendor_documents
FOR DELETE
USING (
  vendor_id = (SELECT auth.uid())
  OR user_has_role('admin')
);

-- 3️⃣ REMOVE DUPLICATE INDEXES
-- Check for duplicate indexes and remove them
DROP INDEX IF EXISTS idx_projects_status_idx;
DROP INDEX IF EXISTS idx_properties_status_idx;
DROP INDEX IF EXISTS idx_vendor_profiles_user_id_idx;
DROP INDEX IF EXISTS idx_user_roles_user_id_idx;

-- Keep only essential indexes (no duplicates)
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);

-- 4️⃣ VERIFY RLS IS ENABLED ON ALL PUBLIC TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- ✅ Phase 1 Complete: All security & performance issues resolved