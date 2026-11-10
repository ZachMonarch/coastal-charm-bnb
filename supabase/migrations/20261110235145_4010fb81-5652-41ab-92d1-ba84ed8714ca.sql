-- Selected security findings: protect invitation visibility with confirmed email identity.
CREATE OR REPLACE FUNCTION public.can_view_own_vendor_invitation(p_invite_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = lower(p_invite_email)
  );
$$;
REVOKE ALL ON FUNCTION public.can_view_own_vendor_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_own_vendor_invitation(text) TO authenticated;

DROP POLICY IF EXISTS vendor_invitations_unified_access ON public.vendor_invitations;
CREATE POLICY vendor_invitations_admin_manage
ON public.vendor_invitations FOR ALL TO authenticated
USING (
  public.is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'property_manager'
  )
)
WITH CHECK (
  public.is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'property_manager'
  )
);
CREATE POLICY vendor_invitations_verified_email_select
ON public.vendor_invitations FOR SELECT TO authenticated
USING (public.can_view_own_vendor_invitation(email));

-- Documents are private. Preserve same-tenant sharing, but bind folder access to
-- either the authenticated owner or the caller's own tenant.
DROP POLICY IF EXISTS storage_documents_select_for_tenant ON storage.objects;
DROP POLICY IF EXISTS "Users can read tenant documents" ON storage.objects;
CREATE POLICY "Users can read tenant documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    (SELECT auth.uid())::text,
    (SELECT public.current_user_tenant_id())::text
  )
);

DROP POLICY IF EXISTS storage_documents_insert_for_tenant ON storage.objects;
CREATE POLICY storage_documents_insert_for_tenant
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    (SELECT auth.uid())::text,
    (SELECT public.current_user_tenant_id())::text
  )
);

DROP POLICY IF EXISTS "Users can update tenant documents" ON storage.objects;
CREATE POLICY "Users can update tenant documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    (SELECT auth.uid())::text,
    (SELECT public.current_user_tenant_id())::text
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    (SELECT auth.uid())::text,
    (SELECT public.current_user_tenant_id())::text
  )
);

DROP POLICY IF EXISTS "Users can delete tenant documents" ON storage.objects;
CREATE POLICY "Users can delete tenant documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    (SELECT auth.uid())::text,
    (SELECT public.current_user_tenant_id())::text
  )
);

-- Remove a stale public-read rule for a bucket that no longer exists.
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;

-- No client may create a deposit record or set its payment status. The checkout
-- function and Stripe webhook use the service role and continue to manage rows.
DROP POLICY IF EXISTS "vendors insert own emd" ON public.emd_transactions;
DROP POLICY IF EXISTS vendors_insert_own_emd ON public.emd_transactions;

-- Vendors may update their own ordinary profile fields, but never grant
-- themselves verification, subscription, or administrative status.
CREATE OR REPLACE FUNCTION public.prevent_vendor_profile_entitlement_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_user((SELECT auth.uid())) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
    NEW.verification_status := false;
    NEW.insurance_verified := false;
    NEW.background_check_verified := false;
    NEW.subscription_status := 'none';
    NEW.subscription_tier := NULL;
    NEW.subscription_plan := NULL;
    NEW.subscription_expires_at := NULL;
    NEW.verification_approved_at := NULL;
    NEW.verification_approved_by := NULL;
    NEW.is_blacklisted := false;
    NEW.blacklist_reason := NULL;
    NEW.blacklisted_at := NULL;
  ELSE
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.insurance_verified IS DISTINCT FROM OLD.insurance_verified
      OR NEW.background_check_verified IS DISTINCT FROM OLD.background_check_verified
      OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
      OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
      OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
      OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at
      OR NEW.verification_approved_at IS DISTINCT FROM OLD.verification_approved_at
      OR NEW.verification_approved_by IS DISTINCT FROM OLD.verification_approved_by
      OR NEW.is_blacklisted IS DISTINCT FROM OLD.is_blacklisted
      OR NEW.blacklist_reason IS DISTINCT FROM OLD.blacklist_reason
      OR NEW.blacklisted_at IS DISTINCT FROM OLD.blacklisted_at THEN
      RAISE EXCEPTION 'Protected vendor account fields may only be changed by an administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_vendor_profile_entitlement_escalation ON public.vendor_profiles;
CREATE TRIGGER prevent_vendor_profile_entitlement_escalation
BEFORE INSERT OR UPDATE ON public.vendor_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_vendor_profile_entitlement_escalation();

-- Booking totals are derived from the authoritative property price and dates.
CREATE OR REPLACE FUNCTION public.set_booking_total_from_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
  v_nights integer;
BEGIN
  IF NEW.property_id IS NULL THEN
    RAISE EXCEPTION 'A property is required to calculate a booking price';
  END IF;
  IF NEW.check_out_date <= NEW.check_in_date THEN
    RAISE EXCEPTION 'Check-out must be after check-in';
  END IF;
  SELECT p.price::numeric INTO v_price
  FROM public.properties p
  WHERE p.id = NEW.property_id AND p.status IN ('available', 'published');
  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'This property is not available for booking';
  END IF;
  v_nights := NEW.check_out_date - NEW.check_in_date;
  NEW.total_amount := v_price * v_nights;
  NEW.user_id := COALESCE(NEW.user_id, (SELECT auth.uid()));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_booking_total_from_property ON public.bookings;
CREATE TRIGGER set_booking_total_from_property
BEFORE INSERT OR UPDATE OF property_id, check_in_date, check_out_date, total_amount
ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_total_from_property();

-- Validate refund ownership and ceiling at the database boundary. Prevent
-- multiple simultaneous requests from exceeding the outstanding payment.
CREATE OR REPLACE FUNCTION public.validate_payment_refund_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_payment_amount numeric;
  v_reserved numeric;
BEGIN
  IF NEW.payment_id IS NULL THEN
    RAISE EXCEPTION 'A payment is required for a refund request';
  END IF;
  SELECT vp.vendor_id, vp.amount INTO v_owner, v_payment_amount
  FROM public.vendor_payments vp
  WHERE vp.id = NEW.payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF NOT public.is_admin_user((SELECT auth.uid())) AND v_owner IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Refunds may only be requested for your own payment';
  END IF;
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive';
  END IF;
  SELECT COALESCE(SUM(pr.amount), 0) INTO v_reserved
  FROM public.payment_refunds pr
  WHERE pr.payment_id = NEW.payment_id
    AND pr.status IN ('pending', 'approved')
    AND pr.id IS DISTINCT FROM NEW.id;
  IF NEW.amount > v_payment_amount - v_reserved THEN
    RAISE EXCEPTION 'Refund amount exceeds the remaining amount paid';
  END IF;
  IF NOT public.is_admin_user((SELECT auth.uid())) THEN
    NEW.requested_by := (SELECT auth.uid());
    NEW.status := 'pending';
    NEW.admin_notes := NULL;
    NEW.processed_by := NULL;
    NEW.processed_at := NULL;
    NEW.stripe_refund_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_payment_refund_request ON public.payment_refunds;
CREATE TRIGGER validate_payment_refund_request
BEFORE INSERT OR UPDATE OF payment_id, amount, requested_by, status, processed_by, stripe_refund_id
ON public.payment_refunds
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_refund_request();

-- Restrict scoring writes to the server-side calculation path and procurement staff.
DROP POLICY IF EXISTS bid_scores_unified_access ON public.bid_scores;
CREATE POLICY bid_scores_staff_read
ON public.bid_scores FOR SELECT TO authenticated
USING (
  public.is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'property_manager'
  )
);

CREATE OR REPLACE FUNCTION public.calculate_bid_score(p_bid_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_bid_amount numeric;
  v_budget numeric;
  v_rating numeric;
  v_tier text;
  v_completed integer;
  v_price_score numeric;
  v_rating_score numeric;
  v_tier_bonus numeric;
  v_completion_score numeric;
  v_total_score numeric;
BEGIN
  IF NOT public.is_admin_user((SELECT auth.uid())) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'property_manager'
  ) THEN
    RAISE EXCEPTION 'Only procurement staff may calculate bid scores';
  END IF;
  SELECT vb.vendor_id, vb.bid_amount, p.budget_max
  INTO v_vendor_id, v_bid_amount, v_budget
  FROM public.vendor_bids vb
  LEFT JOIN public.projects p ON p.id = vb.project_id
  WHERE vb.id = p_bid_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bid not found'; END IF;
  SELECT COALESCE(vp.rating,0), COALESCE(vt.current_tier,'bronze'), COALESCE(vp.completed_jobs,0)
  INTO v_rating, v_tier, v_completed
  FROM public.vendor_profiles vp
  LEFT JOIN public.vendor_tiers vt ON vt.vendor_id = vp.id
  WHERE vp.user_id = v_vendor_id;
  v_price_score := CASE WHEN v_budget > 0 AND v_bid_amount > 0 THEN LEAST(30,(1-(v_bid_amount/v_budget))*30) ELSE 15 END;
  v_rating_score := (COALESCE(v_rating,0)/5)*25;
  v_completion_score := LEAST(20,(COALESCE(v_completed,0)/50.0)*20);
  v_tier_bonus := CASE v_tier WHEN 'platinum' THEN 10 WHEN 'gold' THEN 7 WHEN 'silver' THEN 4 ELSE 1 END;
  v_total_score := v_price_score + v_rating_score + v_completion_score + v_tier_bonus;
  INSERT INTO public.bid_scores (bid_id,price_score,rating_score,completion_rate_score,tier_bonus,total_score,scored_at,scored_by)
  VALUES (p_bid_id,v_price_score,v_rating_score,v_completion_score,v_tier_bonus,v_total_score,now(),(SELECT auth.uid()))
  ON CONFLICT (bid_id) DO UPDATE SET
    price_score=EXCLUDED.price_score,
    rating_score=EXCLUDED.rating_score,
    completion_rate_score=EXCLUDED.completion_rate_score,
    tier_bonus=EXCLUDED.tier_bonus,
    total_score=EXCLUDED.total_score,
    scored_at=EXCLUDED.scored_at,
    scored_by=EXCLUDED.scored_by;
  RETURN v_total_score;
END;
$$;
REVOKE ALL ON FUNCTION public.calculate_bid_score(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_bid_score(uuid) TO authenticated, service_role;
REVOKE INSERT, UPDATE, DELETE ON public.bid_scores FROM authenticated, anon;

-- An authenticated client may check only its own identifier. Anonymous traffic
-- shares a stable bucket; internal service callers may provide server identifiers.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_endpoint text, p_max_requests integer DEFAULT 100, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamptz;
  effective_identifier text;
BEGIN
  IF auth.role() = 'service_role' THEN
    effective_identifier := p_identifier;
  ELSIF (SELECT auth.uid()) IS NOT NULL THEN
    effective_identifier := (SELECT auth.uid())::text;
  ELSE
    effective_identifier := 'anonymous';
  END IF;
  IF p_endpoint IS NULL OR length(p_endpoint) > 128 OR p_max_requests < 1 OR p_window_minutes < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;
  window_start_time := date_trunc('hour', now()) +
    (EXTRACT(minute FROM now())::integer / p_window_minutes) * (p_window_minutes || ' minutes')::interval;
  INSERT INTO public.rate_limits(identifier,endpoint,requests_count,window_start)
  VALUES (effective_identifier,p_endpoint,1,window_start_time)
  ON CONFLICT (identifier,endpoint,window_start)
  DO UPDATE SET requests_count=public.rate_limits.requests_count+1, created_at=now()
  RETURNING requests_count INTO current_count;
  RETURN current_count <= p_max_requests;
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text,text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text,text,integer,integer) TO authenticated, service_role;

-- Keep the public-facing static media and verified vendor image policies intact;
-- their bucket contents are intentionally public presentation assets.