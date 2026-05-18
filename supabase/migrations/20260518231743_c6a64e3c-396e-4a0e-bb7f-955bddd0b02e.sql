-- Harden RFQ public helper functions: no elevated privileges needed because public RLS already limits open/published rows.
CREATE OR REPLACE FUNCTION public.get_public_rfq(_id uuid)
RETURNS TABLE(
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
SECURITY INVOKER
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
  WHERE r.id = _id
    AND r.status IN ('open','published');
$$;

CREATE OR REPLACE FUNCTION public.get_public_rfqs(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE(
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
SECURITY INVOKER
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

GRANT EXECUTE ON FUNCTION public.get_public_rfq(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_rfqs(integer, integer) TO anon, authenticated;

-- Harden analytics insert ownership.
DROP POLICY IF EXISTS news_analytics_insert ON public.news_analytics;
DROP POLICY IF EXISTS news_analytics_insert_authenticated_own ON public.news_analytics;
DROP POLICY IF EXISTS news_analytics_insert_anonymous ON public.news_analytics;

CREATE POLICY news_analytics_insert_authenticated_own
ON public.news_analytics
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY news_analytics_insert_anonymous
ON public.news_analytics
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Harden newsletter subscriptions: signed-in users own their email; anonymous subscriptions must remain pending.
DROP POLICY IF EXISTS newsletter_unified_insert ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS newsletter_insert_authenticated_own_email ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS newsletter_insert_anonymous_pending ON public.newsletter_subscriptions;

CREATE POLICY newsletter_insert_authenticated_own_email
ON public.newsletter_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND lower(email) = lower(COALESCE(auth.email(), ''))
);

CREATE POLICY newsletter_insert_anonymous_pending
ON public.newsletter_subscriptions
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND COALESCE(is_active, false) = false
  AND confirmed_at IS NULL
);

-- Restrict vendor quote-request contact visibility to matched leads.
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
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'property_manager'
  )
  OR EXISTS (
    SELECT 1
    FROM public.vendor_lead_matches vlm
    JOIN public.vendor_profiles vp ON vp.id = vlm.vendor_id
    WHERE vlm.quote_request_id = quick_quote_requests.id
      AND vp.user_id = auth.uid()
  )
);

-- Prevent fabricated sent-email audit rows by ordinary users.
DROP POLICY IF EXISTS sent_emails_user_insert ON public.sent_emails;
DROP POLICY IF EXISTS sent_emails_authenticated_insert ON public.sent_emails;
DROP POLICY IF EXISTS sent_emails_admin_insert ON public.sent_emails;

CREATE POLICY sent_emails_admin_insert
ON public.sent_emails
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

-- Tighten RFQ invitation helper execution. The function itself still validates admin/property_manager roles.
REVOKE EXECUTE ON FUNCTION public.invite_vendors_to_rfq(uuid, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invite_vendors_to_rfq(uuid, uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.invite_vendors_to_rfq(uuid, uuid[]) TO authenticated;

-- Keep role helper callable only by signed-in clients and service role for policy-supported checks.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;