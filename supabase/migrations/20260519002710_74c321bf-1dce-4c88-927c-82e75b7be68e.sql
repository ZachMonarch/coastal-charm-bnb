
-- Fix vendor RFQ visibility: rfq_invites.vendor_id is auth user id, not vendor_profile id.
-- Extend access to users with active rfq_access_grants.
DROP POLICY IF EXISTS rfqs_unified_select ON public.rfqs;
CREATE POLICY rfqs_unified_select ON public.rfqs
  FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR status IN ('open','published')
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = ANY (ARRAY['admin','property_manager'])
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_invites
      WHERE rfq_invites.rfq_id = rfqs.id
        AND rfq_invites.vendor_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_access_grants g
      WHERE g.rfq_id = rfqs.id
        AND g.user_id = (SELECT auth.uid())
        AND g.revoked_at IS NULL
    )
  );

-- Extend rfq_documents read to access-granted users
DROP POLICY IF EXISTS rfq_documents_unified_select ON public.rfq_documents;
CREATE POLICY rfq_documents_unified_select ON public.rfq_documents
  FOR SELECT TO authenticated
  USING (
    is_admin_user((SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'property_manager'
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_invites
      WHERE rfq_invites.rfq_id = rfq_documents.rfq_id
        AND rfq_invites.vendor_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.rfq_access_grants g
      WHERE g.rfq_id = rfq_documents.rfq_id
        AND g.user_id = (SELECT auth.uid())
        AND g.revoked_at IS NULL
    )
  );

-- Extend storage read policy for rfq-documents bucket
DROP POLICY IF EXISTS rfq_docs_vendor_read ON storage.objects;
CREATE POLICY rfq_docs_vendor_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rfq-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM public.rfq_invites ri
        JOIN public.rfq_documents rd ON rd.rfq_id = ri.rfq_id
        WHERE ri.vendor_id = auth.uid()
          AND rd.file_path = objects.name
      )
      OR EXISTS (
        SELECT 1
        FROM public.rfq_access_grants g
        JOIN public.rfq_documents rd ON rd.rfq_id = g.rfq_id
        WHERE g.user_id = auth.uid()
          AND g.revoked_at IS NULL
          AND rd.file_path = objects.name
      )
    )
  );
