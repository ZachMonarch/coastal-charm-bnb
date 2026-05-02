
-- Replace the SECURITY DEFINER view with a security_invoker view + RPC
DROP VIEW IF EXISTS public.rfqs_public_masked;

-- Public RPC: list of open RFQs with masked details. Bypasses RLS via SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.get_public_rfqs(_limit int DEFAULT 50, _offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  deadline timestamptz,
  category text,
  expected_duration text,
  preview text,
  project_address_summary text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.title,
    r.status,
    r.deadline,
    r.category,
    r.expected_duration,
    LEFT(COALESCE(r.description, ''), 240) AS preview,
    r.document_control->>'project_address' AS project_address_summary,
    r.created_at
  FROM public.rfqs r
  WHERE r.status IN ('open','published')
  ORDER BY r.deadline ASC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 200))
  OFFSET GREATEST(0, _offset);
$$;

CREATE OR REPLACE FUNCTION public.get_public_rfq(_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  deadline timestamptz,
  category text,
  expected_duration text,
  preview text,
  project_address_summary text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.title,
    r.status,
    r.deadline,
    r.category,
    r.expected_duration,
    LEFT(COALESCE(r.description, ''), 240) AS preview,
    r.document_control->>'project_address' AS project_address_summary,
    r.created_at
  FROM public.rfqs r
  WHERE r.id = _id AND r.status IN ('open','published');
$$;

-- Allow anon + authenticated to call discovery RPCs; revoke from public role
REVOKE ALL ON FUNCTION public.get_public_rfqs(int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_rfqs(int,int) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_rfq(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_rfq(uuid) TO anon, authenticated;

-- Lock down has_rfq_access to authenticated only (it's used in policies)
REVOKE ALL ON FUNCTION public.has_rfq_access(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_rfq_access(uuid, uuid) TO authenticated;

-- Lock down trigger functions
REVOKE ALL ON FUNCTION public.log_rfq_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_on_rfq_request_approval() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
