
-- 1) app.bid_lines: restrict tenant-wide SELECT branch to admin/property_manager
DROP POLICY IF EXISTS app_bid_lines_unified_select ON app.bid_lines;
CREATE POLICY app_bid_lines_unified_select ON app.bid_lines
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app.bids b
    WHERE b.id = bid_lines.vendor_bid_id AND b.vendor_id = app.user_id()
  )
  OR EXISTS (
    SELECT 1 FROM app.rfq_lots l
    JOIN app.rfqs r ON r.id = l.rfq_id
    WHERE l.id = bid_lines.lot_id
      AND r.tenant_id = app.current_tenant()
      AND (app.has_role_v1('admin') OR app.has_role_v1('property_manager'))
  )
);

-- 2) app.rfq_invites: restrict tenant-wide SELECT branch to admin/property_manager
DROP POLICY IF EXISTS app_rfq_invites_unified_select ON app.rfq_invites;
CREATE POLICY app_rfq_invites_unified_select ON app.rfq_invites
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app.rfqs r
    WHERE r.id = rfq_invites.rfq_id
      AND (
        r.created_by = app.user_id()
        OR (
          r.tenant_id = app.current_tenant()
          AND (app.has_role_v1('admin') OR app.has_role_v1('property_manager'))
        )
      )
  )
);

-- 3) public.vendor_profiles: remove the broad "is_verified = true" branch
DROP POLICY IF EXISTS vendor_profiles_unified_select_v2 ON public.vendor_profiles;
CREATE POLICY vendor_profiles_unified_select_v2 ON public.vendor_profiles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = ANY (ARRAY['admin'::text, 'property_manager'::text])
  )
);

-- Public, non-PII view for marketplace listings of verified vendors
DROP VIEW IF EXISTS public.vendor_profiles_public CASCADE;
CREATE VIEW public.vendor_profiles_public
WITH (security_barrier = true) AS
SELECT
  id, user_id, company_name, description, avatar_url,
  specialties, service_areas, certifications, years_experience,
  rating, average_rating, completed_jobs, response_time_hours, success_rate,
  is_verified, insurance_verified, background_check_verified,
  availability_status, subscription_plan, subscription_status,
  last_active_at, created_at
FROM public.vendor_profiles
WHERE is_verified = true
  AND COALESCE(is_blacklisted, false) = false;

GRANT SELECT ON public.vendor_profiles_public TO anon, authenticated;
