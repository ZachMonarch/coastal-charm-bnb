-- 1) Prevent self privilege / tenant escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_user(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'Not allowed to change tenant_id';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not allowed to change role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Remove duplicate/weak self-update policy (covered by profiles_unified_update)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Ensure the remaining update policy has a WITH CHECK
DROP POLICY IF EXISTS "profiles_unified_update" ON public.profiles;
CREATE POLICY "profiles_unified_update" ON public.profiles
FOR UPDATE TO authenticated
USING ((id = (SELECT auth.uid())) OR public.is_admin_user((SELECT auth.uid())))
WITH CHECK ((id = (SELECT auth.uid())) OR public.is_admin_user((SELECT auth.uid())));

-- 2) Restrict overbroad tenant-wide RFQ SELECT (public schema)
DROP POLICY IF EXISTS "app_rfqs_unified_select" ON public.rfqs;
CREATE POLICY "app_rfqs_unified_select" ON public.rfqs
FOR SELECT TO authenticated
USING (
  tenant_id = app.current_tenant()
  AND (
    created_by = (SELECT auth.uid())
    OR status = ANY (ARRAY['open','published'])
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = ANY (ARRAY['admin','property_manager'])
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_invites i
      WHERE i.rfq_id = rfqs.id AND i.vendor_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_access_grants g
      WHERE g.rfq_id = rfqs.id AND g.user_id = (SELECT auth.uid()) AND g.revoked_at IS NULL
    )
  )
);

-- 3) Same restriction for the app schema table
DROP POLICY IF EXISTS "app_rfqs_unified_select" ON app.rfqs;
CREATE POLICY "app_rfqs_unified_select" ON app.rfqs
FOR SELECT TO authenticated
USING (
  tenant_id = app.current_tenant()
  AND (
    created_by = (SELECT auth.uid())
    OR status = ANY (ARRAY['open','published'])
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = ANY (ARRAY['admin','property_manager'])
    )
  )
);
