
-- ============ EMD ============
CREATE TABLE IF NOT EXISTS public.emd_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','held','refunded','forfeited','failed')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_refund_id text,
  paid_at timestamptz,
  released_at timestamptz,
  forfeited_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rfq_id, vendor_id)
);
CREATE INDEX IF NOT EXISTS idx_emd_rfq ON public.emd_transactions(rfq_id);
CREATE INDEX IF NOT EXISTS idx_emd_vendor ON public.emd_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_emd_status ON public.emd_transactions(status);
ALTER TABLE public.emd_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors view own emd" ON public.emd_transactions
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vendors insert own emd" ON public.emd_transactions
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "admins update emd" ON public.emd_transactions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ RFQ requires_emd ============
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS requires_emd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emd_amount_cents integer NOT NULL DEFAULT 0 CHECK (emd_amount_cents >= 0);

-- ============ Scoring weights ============
CREATE TABLE IF NOT EXISTS public.rfq_scoring_weights (
  rfq_id uuid PRIMARY KEY REFERENCES public.rfqs(id) ON DELETE CASCADE,
  price_weight numeric NOT NULL DEFAULT 40 CHECK (price_weight BETWEEN 0 AND 100),
  delivery_weight numeric NOT NULL DEFAULT 20 CHECK (delivery_weight BETWEEN 0 AND 100),
  compliance_weight numeric NOT NULL DEFAULT 15 CHECK (compliance_weight BETWEEN 0 AND 100),
  experience_weight numeric NOT NULL DEFAULT 15 CHECK (experience_weight BETWEEN 0 AND 100),
  quality_weight numeric NOT NULL DEFAULT 10 CHECK (quality_weight BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.rfq_scoring_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone authed can view scoring weights" ON public.rfq_scoring_weights
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage scoring weights" ON public.rfq_scoring_weights
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ Bid shortlist ============
CREATE TABLE IF NOT EXISTS public.bid_shortlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL,
  shortlisted_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rfq_id, vendor_id)
);
ALTER TABLE public.bid_shortlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage shortlist" ON public.bid_shortlist
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ Vendor blacklist ============
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS is_blacklisted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_reason text,
  ADD COLUMN IF NOT EXISTS blacklisted_at timestamptz;

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at_v2()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_emd_updated ON public.emd_transactions;
CREATE TRIGGER trg_emd_updated BEFORE UPDATE ON public.emd_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_v2();

DROP TRIGGER IF EXISTS trg_rfq_weights_updated ON public.rfq_scoring_weights;
CREATE TRIGGER trg_rfq_weights_updated BEFORE UPDATE ON public.rfq_scoring_weights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_v2();

-- ============ RPCs ============

-- get_top_vendors: leaderboard
CREATE OR REPLACE FUNCTION public.get_top_vendors(_limit integer DEFAULT 10)
RETURNS TABLE(
  vendor_id uuid,
  company_name text,
  rating numeric,
  completed_jobs integer,
  contracts_awarded bigint,
  total_contract_value numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT vp.user_id AS vendor_id,
         vp.company_name,
         COALESCE(vp.rating, 0) AS rating,
         COALESCE(vp.completed_jobs, 0) AS completed_jobs,
         COALESCE(c.cnt, 0) AS contracts_awarded,
         COALESCE(c.total_value, 0) AS total_contract_value
  FROM public.vendor_profiles vp
  LEFT JOIN (
    SELECT vendor_id, COUNT(*) AS cnt, SUM(contract_value) AS total_value
    FROM public.contracts WHERE status IN ('active','completed') GROUP BY vendor_id
  ) c ON c.vendor_id = vp.user_id
  WHERE vp.is_verified = true AND vp.is_blacklisted = false
  ORDER BY contracts_awarded DESC, rating DESC NULLS LAST
  LIMIT _limit;
$$;

-- get_admin_vendor_detail
CREATE OR REPLACE FUNCTION public.get_admin_vendor_detail(_vendor_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT jsonb_build_object(
    'profile', to_jsonb(vp.*),
    'user', to_jsonb(p.*),
    'contracts', COALESCE((SELECT jsonb_agg(to_jsonb(c.*)) FROM public.contracts c WHERE c.vendor_id = _vendor_id), '[]'::jsonb),
    'bids', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id',b.id,'rfq_lot_id',b.rfq_lot_id,'unit_price',b.unit_price,'submitted_at',b.submitted_at))
      FROM public.bid_lines b WHERE b.vendor_id = _vendor_id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.vendor_profiles vp
  LEFT JOIN public.profiles p ON p.id = vp.user_id
  WHERE vp.user_id = _vendor_id;
  RETURN result;
END; $$;

-- compute_bid_score
CREATE OR REPLACE FUNCTION public.compute_bid_score(_bid_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w RECORD; b RECORD; vp RECORD; min_price numeric; score numeric := 0;
BEGIN
  SELECT bl.*, l.rfq_id INTO b FROM public.bid_lines bl
    JOIN public.rfq_lots l ON l.id = bl.rfq_lot_id WHERE bl.id = _bid_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  SELECT * INTO w FROM public.rfq_scoring_weights WHERE rfq_id = b.rfq_id;
  IF NOT FOUND THEN
    w.price_weight := 40; w.delivery_weight := 20; w.compliance_weight := 15;
    w.experience_weight := 15; w.quality_weight := 10;
  END IF;
  SELECT MIN(unit_price) INTO min_price FROM public.bid_lines WHERE rfq_lot_id = b.rfq_lot_id;
  SELECT * INTO vp FROM public.vendor_profiles WHERE user_id = b.vendor_id;
  IF min_price > 0 AND b.unit_price > 0 THEN
    score := score + w.price_weight * (min_price / b.unit_price);
  END IF;
  IF vp.is_verified THEN score := score + w.compliance_weight; END IF;
  score := score + w.experience_weight * LEAST(COALESCE(vp.completed_jobs,0)::numeric / 50, 1);
  score := score + w.quality_weight * (COALESCE(vp.rating,0) / 5);
  score := score + w.delivery_weight * 0.5; -- placeholder until delivery metric exists
  RETURN ROUND(score, 2);
END; $$;

-- get_cross_rfq_bids
CREATE OR REPLACE FUNCTION public.get_cross_rfq_bids(_status text DEFAULT NULL)
RETURNS TABLE(
  rfq_id uuid, rfq_title text, rfq_status text,
  vendor_id uuid, vendor_name text,
  total_amount numeric, bid_count bigint, last_submitted_at timestamptz,
  is_shortlisted boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.title, r.status,
         bl.vendor_id,
         p.full_name,
         SUM(bl.unit_price * COALESCE(l.quantity,1)) AS total_amount,
         COUNT(*) AS bid_count,
         MAX(bl.submitted_at),
         EXISTS(SELECT 1 FROM public.bid_shortlist s WHERE s.rfq_id = r.id AND s.vendor_id = bl.vendor_id)
  FROM public.bid_lines bl
  JOIN public.rfq_lots l ON l.id = bl.rfq_lot_id
  JOIN public.rfqs r ON r.id = l.rfq_id
  LEFT JOIN public.profiles p ON p.id = bl.vendor_id
  WHERE public.has_role(auth.uid(),'admin')
    AND (_status IS NULL OR r.status = _status)
  GROUP BY r.id, r.title, r.status, bl.vendor_id, p.full_name;
$$;

-- forfeit_emd
CREATE OR REPLACE FUNCTION public.forfeit_emd(_emd_id uuid, _notes text DEFAULT NULL)
RETURNS public.emd_transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.emd_transactions;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.emd_transactions
    SET status='forfeited', forfeited_at=now(), notes=COALESCE(_notes,notes)
    WHERE id=_emd_id AND status='held'
    RETURNING * INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'EMD not found or not in held state'; END IF;
  INSERT INTO public.rfq_audit_log(rfq_id, entity_type, entity_id, action, actor_id, after_data)
    VALUES (r.rfq_id, 'emd', r.id::text, 'forfeit', auth.uid(), to_jsonb(r));
  RETURN r;
END; $$;

-- refund_emd (marks refunded; actual Stripe refund handled by edge function)
CREATE OR REPLACE FUNCTION public.refund_emd(_emd_id uuid, _refund_id text DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS public.emd_transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.emd_transactions;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.emd_transactions
    SET status='refunded', released_at=now(), stripe_refund_id=COALESCE(_refund_id, stripe_refund_id),
        notes=COALESCE(_notes, notes)
    WHERE id=_emd_id AND status='held'
    RETURNING * INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'EMD not found or not in held state'; END IF;
  INSERT INTO public.rfq_audit_log(rfq_id, entity_type, entity_id, action, actor_id, after_data)
    VALUES (r.rfq_id, 'emd', r.id::text, 'refund', auth.uid(), to_jsonb(r));
  RETURN r;
END; $$;
