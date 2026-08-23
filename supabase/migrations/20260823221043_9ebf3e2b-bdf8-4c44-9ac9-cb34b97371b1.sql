-- Restrict vendor_payment_methods policies to authenticated role only
DROP POLICY IF EXISTS vendor_payment_methods_admin_select ON public.vendor_payment_methods;
DROP POLICY IF EXISTS vendor_payment_methods_owner_select ON public.vendor_payment_methods;
DROP POLICY IF EXISTS vendor_payment_methods_owner_insert ON public.vendor_payment_methods;
DROP POLICY IF EXISTS vendor_payment_methods_owner_update ON public.vendor_payment_methods;
DROP POLICY IF EXISTS vendor_payment_methods_owner_delete ON public.vendor_payment_methods;

CREATE POLICY vendor_payment_methods_owner_select
  ON public.vendor_payment_methods FOR SELECT TO authenticated
  USING (vendor_id = (SELECT auth.uid()));

CREATE POLICY vendor_payment_methods_admin_select
  ON public.vendor_payment_methods FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY vendor_payment_methods_owner_insert
  ON public.vendor_payment_methods FOR INSERT TO authenticated
  WITH CHECK (vendor_id = (SELECT auth.uid()));

CREATE POLICY vendor_payment_methods_owner_update
  ON public.vendor_payment_methods FOR UPDATE TO authenticated
  USING (vendor_id = (SELECT auth.uid()))
  WITH CHECK (vendor_id = (SELECT auth.uid()));

CREATE POLICY vendor_payment_methods_owner_delete
  ON public.vendor_payment_methods FOR DELETE TO authenticated
  USING (vendor_id = (SELECT auth.uid()));

ALTER TABLE public.vendor_payment_methods ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.vendor_payment_methods FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payment_methods TO authenticated;
GRANT ALL ON public.vendor_payment_methods TO service_role;