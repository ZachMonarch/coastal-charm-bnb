
-- 1. Tighten quick_quote_requests vendor PII access: require active lead match
DROP POLICY IF EXISTS quick_quote_requests_unified_select ON public.quick_quote_requests;
CREATE POLICY quick_quote_requests_unified_select ON public.quick_quote_requests
FOR SELECT TO authenticated
USING (
  property_manager_id = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'property_manager'
  )
  OR EXISTS (
    SELECT 1 FROM public.vendor_lead_matches vlm
    JOIN public.vendor_profiles vp ON vp.id = vlm.vendor_id
    WHERE vlm.quote_request_id = quick_quote_requests.id
      AND vp.user_id = auth.uid()
      AND vlm.response_status IS NOT NULL
      AND vlm.response_status <> 'pending'
  )
);

-- 2. Remove redundant sent_emails admin insert policy (covered by sent_emails_admin_access ALL)
DROP POLICY IF EXISTS sent_emails_admin_insert ON public.sent_emails;

-- 3. Remove anon access to full rfq_lots rows; public access must go through SECURITY INVOKER RPCs
DROP POLICY IF EXISTS rfq_lots_public_shared_select ON public.rfq_lots;

-- 4. Remove anon access to full rfqs rows; use get_public_rfqs / get_public_rfq RPCs for public browse
DROP POLICY IF EXISTS rfqs_public_shared_select ON public.rfqs;

-- 5. Storage 'media' bucket: scope INSERT to per-user folder
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
