-- Fix 1: team_members SELECT policy - restrict to admin/property_manager only
DROP POLICY IF EXISTS team_members_select_authenticated ON public.team_members;

CREATE POLICY team_members_select_staff ON public.team_members
  FOR SELECT TO authenticated
  USING (
    is_admin_user((SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'property_manager'
    )
  );

-- Fix 2: is_staff_or_admin - replace tautological tenant check with actual tenant scoping
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'property_manager')
    AND p.tenant_id = public.current_user_tenant_id()
  )
$$;

-- Fix 3: RFQ app_ policies - change from public role to authenticated
DROP POLICY IF EXISTS app_rfqs_unified_select ON public.rfqs;
DROP POLICY IF EXISTS app_rfqs_unified_insert ON public.rfqs;
DROP POLICY IF EXISTS app_rfqs_unified_update ON public.rfqs;
DROP POLICY IF EXISTS app_rfqs_unified_delete ON public.rfqs;

CREATE POLICY app_rfqs_unified_select ON public.rfqs
  FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant());

CREATE POLICY app_rfqs_unified_insert ON public.rfqs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = app.current_tenant());

CREATE POLICY app_rfqs_unified_update ON public.rfqs
  FOR UPDATE TO authenticated
  USING (tenant_id = app.current_tenant() AND app.has_role_v1('admin'));

CREATE POLICY app_rfqs_unified_delete ON public.rfqs
  FOR DELETE TO authenticated
  USING (tenant_id = app.current_tenant() AND app.has_role_v1('admin'));

-- Fix 4: Property images storage policies - add owner/admin scoping
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can delete their images" ON storage.objects;

CREATE POLICY property_images_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR is_admin_user((SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'property_manager')
    )
  );

CREATE POLICY property_images_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR is_admin_user((SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'property_manager')
    )
  );