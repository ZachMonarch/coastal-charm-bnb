DROP POLICY IF EXISTS quick_quote_requests_unified_select ON public.quick_quote_requests;

CREATE POLICY quick_quote_requests_unified_select
ON public.quick_quote_requests
FOR SELECT
TO authenticated
USING (
  property_manager_id = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.vendor_lead_matches vlm
    JOIN public.vendor_profiles vp ON vp.id = vlm.vendor_id
    WHERE vlm.quote_request_id = quick_quote_requests.id
      AND vp.user_id = auth.uid()
      AND vlm.response_status = 'accepted'
  )
);