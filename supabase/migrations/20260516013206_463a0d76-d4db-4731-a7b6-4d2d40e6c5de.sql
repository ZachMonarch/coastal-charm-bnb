
-- 1) Backfill tenant_id for admin/property_manager profiles that are missing it
UPDATE public.profiles p
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE p.tenant_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role IN ('admin','property_manager')
  );

-- 2) Tenant resolver: fall back to default tenant for admins without one
CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin','property_manager')
      )
      THEN '00000000-0000-0000-0000-000000000001'::uuid
      ELSE NULL
    END
  );
$$;

-- 3) Public read access for shared RFQ URLs (open/published)
DROP POLICY IF EXISTS rfqs_public_shared_select ON public.rfqs;
CREATE POLICY rfqs_public_shared_select
ON public.rfqs
FOR SELECT
TO anon, authenticated
USING (status IN ('open','published'));

DROP POLICY IF EXISTS rfq_lots_public_shared_select ON public.rfq_lots;
CREATE POLICY rfq_lots_public_shared_select
ON public.rfq_lots
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.rfqs r
  WHERE r.id = rfq_lots.rfq_id
    AND r.status IN ('open','published')
));
