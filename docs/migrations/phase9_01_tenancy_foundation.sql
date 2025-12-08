-- =====================================================
-- PHASE 9 - MIGRATION 1: TENANCY FOUNDATION
-- =====================================================
-- Creates tenants table and adds tenant_id to core tables
-- Safe to run: Uses IF NOT EXISTS and ON CONFLICT
-- =====================================================

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tenants RLS policy (admins only)
DROP POLICY IF EXISTS "tenants_admin_only" ON public.tenants;
CREATE POLICY "tenants_admin_only" ON public.tenants
  FOR ALL 
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- 2. Add tenant_id to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
  END IF;
END $$;

-- 3. Add tenant_id to vendor_profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_profiles' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.vendor_profiles 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_vendor_profiles_tenant_id ON public.vendor_profiles(tenant_id);
  END IF;
END $$;

-- 4. Add tenant_id to projects (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.projects 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects(tenant_id);
  END IF;
END $$;

-- 5. Add tenant_id to invoices (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.invoices 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
  END IF;
END $$;

-- 6. Create default tenant (idempotent)
INSERT INTO public.tenants (id, name, plan, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Monarch Property Management',
  'enterprise',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Assign existing data to default tenant
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.vendor_profiles SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.projects SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE public.invoices SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;

-- 8. Update RLS policies to include tenant_id checks
-- Profiles: Update to include tenant isolation
DROP POLICY IF EXISTS "profiles_tenant_isolated_select" ON public.profiles;
CREATE POLICY "profiles_tenant_isolated_select" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR is_admin_user(auth.uid())
    OR (
      user_has_role(auth.uid(), 'property_manager') 
      AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "profiles_tenant_isolated_update" ON public.profiles;
CREATE POLICY "profiles_tenant_isolated_update" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Vendor Profiles: Add tenant isolation
DROP POLICY IF EXISTS "vendor_profiles_unified_select" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_unified_select" ON public.vendor_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user(auth.uid()) 
    OR user_id = auth.uid()
    OR (
      user_has_role(auth.uid(), 'property_manager')
      AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "vendor_profiles_unified_update" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_unified_update" ON public.vendor_profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_user(auth.uid()) 
    OR user_id = auth.uid()
  )
  WITH CHECK (
    (is_admin_user(auth.uid()) OR user_id = auth.uid())
    AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Projects: Add tenant isolation
DROP POLICY IF EXISTS "projects_tenant_isolated_select" ON public.projects;
CREATE POLICY "projects_tenant_isolated_select" ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user(auth.uid())
    OR user_has_role(auth.uid(), 'property_manager')
    OR created_by = auth.uid()
    OR assigned_vendor_id = auth.uid()
    OR (
      status = 'open' 
      AND user_has_role(auth.uid(), 'vendor')
      AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- VERIFICATION QUERIES (run these after migration)
-- =====================================================
-- SELECT COUNT(*) FROM public.tenants; -- Should return 1
-- SELECT COUNT(*) FROM public.profiles WHERE tenant_id IS NULL; -- Should return 0
-- SELECT COUNT(*) FROM public.vendor_profiles WHERE tenant_id IS NULL; -- Should return 0
-- SELECT COUNT(*) FROM public.projects WHERE tenant_id IS NULL; -- Should return 0
