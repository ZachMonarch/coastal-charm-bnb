-- Documents are private. Remove overlapping policies that could authorize an otherwise denied file.
DROP POLICY IF EXISTS "Users can read tenant documents" ON storage.objects;
DROP POLICY IF EXISTS storage_documents_select_for_tenant ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update tenant documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS storage_documents_insert_for_tenant ON storage.objects;
DROP POLICY IF EXISTS "Users can delete tenant documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY documents_authorized_read
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR (storage.foldername(name))[1] = (SELECT public.current_user_tenant_id())::text
    OR public.is_admin_user((SELECT auth.uid()))
  )
);

CREATE POLICY documents_owner_or_admin_upload
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR public.is_admin_user((SELECT auth.uid()))
  )
);

CREATE POLICY documents_owner_or_admin_update
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR public.is_admin_user((SELECT auth.uid()))
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR public.is_admin_user((SELECT auth.uid()))
  )
);

CREATE POLICY documents_owner_or_admin_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR public.is_admin_user((SELECT auth.uid()))
  )
);

-- Only the signed Stripe webhook may transition a pending EMD to held.
DROP POLICY IF EXISTS "admins update emd" ON public.emd_transactions;
DROP POLICY IF EXISTS admins_update_emd ON public.emd_transactions;

CREATE OR REPLACE FUNCTION public.guard_emd_held_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_required_amount integer;
BEGIN
  IF NEW.status = 'held' AND OLD.status IS DISTINCT FROM 'held' THEN
    IF auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'EMD may only be marked held by verified payment processing';
    END IF;
    IF OLD.status <> 'pending' OR NEW.stripe_payment_intent_id IS NULL OR NEW.paid_at IS NULL THEN
      RAISE EXCEPTION 'A pending EMD and confirmed payment are required';
    END IF;
    SELECT r.emd_amount_cents INTO v_required_amount
    FROM public.rfqs r WHERE r.id = NEW.rfq_id AND r.requires_emd = true;
    IF v_required_amount IS NULL OR NEW.amount_cents <> v_required_amount OR lower(NEW.currency) <> 'usd' THEN
      RAISE EXCEPTION 'EMD amount or currency does not match the RFQ';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_emd_held_transition ON public.emd_transactions;
CREATE TRIGGER guard_emd_held_transition
BEFORE UPDATE OF status ON public.emd_transactions
FOR EACH ROW EXECUTE FUNCTION public.guard_emd_held_transition();