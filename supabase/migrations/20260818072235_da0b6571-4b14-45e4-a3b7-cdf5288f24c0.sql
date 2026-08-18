DROP POLICY IF EXISTS bid_lines_insert_vendor ON public.bid_lines;
CREATE POLICY bid_lines_insert_vendor
ON public.bid_lines
FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'vendor'
  )
);

DROP POLICY IF EXISTS bid_lines_update_own ON public.bid_lines;
CREATE POLICY bid_lines_update_own
ON public.bid_lines
FOR UPDATE
TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'vendor'
  )
)
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'vendor'
  )
);