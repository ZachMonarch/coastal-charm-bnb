-- 1) vendor_bids INSERT must rely solely on user_roles (profiles.role is user-editable)
DROP POLICY IF EXISTS vendor_bids_insert_vendor ON public.vendor_bids;
CREATE POLICY vendor_bids_insert_vendor
ON public.vendor_bids
FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'vendor'
  )
);

-- 2) Also guard privileged columns on INSERT (self-signup path)
CREATE OR REPLACE FUNCTION public.prevent_profile_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin_user(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Non-admins may never self-assign a privileged role at insert time
  IF NEW.role IS NOT NULL AND NEW.role NOT IN ('tenant', 'property_owner', 'user') THEN
    NEW.role := 'tenant';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_insert ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_insert();