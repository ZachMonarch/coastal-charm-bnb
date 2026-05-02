
-- =====================================================================
-- 1. Per-RFQ access REQUESTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rfq_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text,
  full_name text,
  company_name text,
  phone text,
  message text,
  rfi_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rfq_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_access_requests_rfq ON public.rfq_access_requests(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_access_requests_user ON public.rfq_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rfq_access_requests_status ON public.rfq_access_requests(status);

ALTER TABLE public.rfq_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_access_requests_self_insert" ON public.rfq_access_requests;
CREATE POLICY "rfq_access_requests_self_insert"
  ON public.rfq_access_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "rfq_access_requests_self_select" ON public.rfq_access_requests;
CREATE POLICY "rfq_access_requests_self_select"
  ON public.rfq_access_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'property_manager')
  );

DROP POLICY IF EXISTS "rfq_access_requests_admin_update" ON public.rfq_access_requests;
CREATE POLICY "rfq_access_requests_admin_update"
  ON public.rfq_access_requests FOR UPDATE TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'property_manager')
  );

DROP POLICY IF EXISTS "rfq_access_requests_admin_delete" ON public.rfq_access_requests;
CREATE POLICY "rfq_access_requests_admin_delete"
  ON public.rfq_access_requests FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- =====================================================================
-- 2. Per-RFQ access GRANTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rfq_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  notes text,
  UNIQUE(rfq_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_access_grants_rfq ON public.rfq_access_grants(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_access_grants_user ON public.rfq_access_grants(user_id);

ALTER TABLE public.rfq_access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_access_grants_select" ON public.rfq_access_grants;
CREATE POLICY "rfq_access_grants_select"
  ON public.rfq_access_grants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'property_manager')
  );

DROP POLICY IF EXISTS "rfq_access_grants_admin_write" ON public.rfq_access_grants;
CREATE POLICY "rfq_access_grants_admin_write"
  ON public.rfq_access_grants FOR ALL TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'property_manager')
  )
  WITH CHECK (
    public.is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- =====================================================================
-- 3. Helper: has_rfq_access
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_rfq_access(_rfq uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin_user(_user)
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = _user AND role = 'property_manager')
    OR EXISTS (SELECT 1 FROM public.rfqs
               WHERE id = _rfq AND created_by = _user)
    OR EXISTS (SELECT 1 FROM public.rfq_access_grants
               WHERE rfq_id = _rfq AND user_id = _user AND revoked_at IS NULL)
$$;

-- =====================================================================
-- 4. RFQ audit log
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rfq_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid,
  entity_type text NOT NULL,
  entity_id text,
  action text NOT NULL,
  actor_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_audit_log_rfq ON public.rfq_audit_log(rfq_id, created_at DESC);

ALTER TABLE public.rfq_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_audit_log_admin_read" ON public.rfq_audit_log;
CREATE POLICY "rfq_audit_log_admin_read"
  ON public.rfq_audit_log FOR SELECT TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- Inserts are done via SECURITY DEFINER triggers; deny direct write
DROP POLICY IF EXISTS "rfq_audit_log_no_write" ON public.rfq_audit_log;
CREATE POLICY "rfq_audit_log_no_write"
  ON public.rfq_audit_log FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.log_rfq_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rfq_id uuid;
  v_action text;
BEGIN
  v_action := TG_OP;
  IF TG_TABLE_NAME = 'rfqs' THEN
    v_rfq_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'rfq_properties' THEN
    v_rfq_id := COALESCE(NEW.rfq_id, OLD.rfq_id);
  ELSIF TG_TABLE_NAME = 'rfq_access_grants' THEN
    v_rfq_id := COALESCE(NEW.rfq_id, OLD.rfq_id);
  END IF;

  INSERT INTO public.rfq_audit_log(rfq_id, entity_type, entity_id, action, actor_id, before_data, after_data)
  VALUES(
    v_rfq_id,
    TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP='DELETE' THEN OLD.id::text ELSE NEW.id::text END), NULL),
    v_action,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_rfqs ON public.rfqs;
CREATE TRIGGER trg_audit_rfqs
  AFTER INSERT OR UPDATE OR DELETE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.log_rfq_change();

DROP TRIGGER IF EXISTS trg_audit_rfq_properties ON public.rfq_properties;
CREATE TRIGGER trg_audit_rfq_properties
  AFTER INSERT OR UPDATE OR DELETE ON public.rfq_properties
  FOR EACH ROW EXECUTE FUNCTION public.log_rfq_change();

DROP TRIGGER IF EXISTS trg_audit_rfq_access_grants ON public.rfq_access_grants;
CREATE TRIGGER trg_audit_rfq_access_grants
  AFTER INSERT OR UPDATE OR DELETE ON public.rfq_access_grants
  FOR EACH ROW EXECUTE FUNCTION public.log_rfq_change();

-- =====================================================================
-- 5. Public masked view for anonymous discovery
--    SECURITY INVOKER off so the view bypasses RLS but exposes only
--    safe summary columns. Granted to anon + authenticated.
-- =====================================================================
DROP VIEW IF EXISTS public.rfqs_public_masked;
CREATE VIEW public.rfqs_public_masked
WITH (security_invoker = false) AS
  SELECT
    r.id,
    r.title,
    r.status,
    r.deadline,
    r.category,
    r.expected_duration,
    LEFT(COALESCE(r.description, ''), 240) AS preview,
    COALESCE(r.document_control->>'project_address', NULL) AS project_address_summary,
    r.created_at
  FROM public.rfqs r
  WHERE r.status IN ('open','published');

GRANT SELECT ON public.rfqs_public_masked TO anon, authenticated;

-- =====================================================================
-- 6. updated_at trigger for access requests
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rfq_access_requests_updated ON public.rfq_access_requests;
CREATE TRIGGER trg_rfq_access_requests_updated
  BEFORE UPDATE ON public.rfq_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 7. Auto-create grant when an access request is approved
-- =====================================================================
CREATE OR REPLACE FUNCTION public.grant_on_rfq_request_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.rfq_access_grants(rfq_id, user_id, granted_by, notes)
    VALUES (NEW.rfq_id, NEW.user_id, COALESCE(NEW.reviewed_by, auth.uid()), NEW.admin_notes)
    ON CONFLICT (rfq_id, user_id) DO UPDATE
      SET revoked_at = NULL,
          granted_by = EXCLUDED.granted_by,
          granted_at = now(),
          notes = EXCLUDED.notes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_on_approval ON public.rfq_access_requests;
CREATE TRIGGER trg_grant_on_approval
  AFTER UPDATE ON public.rfq_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.grant_on_rfq_request_approval();
