-- =====================================================
-- FIX REMAINING 4 ERROR-LEVEL SECURITY FINDINGS
-- =====================================================

-- =====================================================
-- 1. FIX PROPERTIES TABLE - Restrict owner_id exposure
-- =====================================================
DROP POLICY IF EXISTS "properties_unified_select" ON public.properties;

-- Require authentication for properties with sensitive fields
-- Public can only see available properties (but via sanitized view)
CREATE POLICY "properties_unified_select" ON public.properties
FOR SELECT USING (
  -- Authenticated users can see available properties
  ((SELECT auth.uid()) IS NOT NULL AND status = 'available')
  -- Admins can see all
  OR (SELECT is_admin_user((SELECT auth.uid())))
  -- Property managers can see all
  OR (SELECT user_has_role('property_manager'))
  -- Owners can see their own
  OR (owner_id = (SELECT auth.uid())::text)
);

-- =====================================================
-- 2. FIX AUDIT_LOGS - Restrict INSERT to admin/service only
-- =====================================================
DROP POLICY IF EXISTS "audit_logs_restricted_insert" ON public.audit_logs;

-- Only admins and service_role can insert audit logs
CREATE POLICY "audit_logs_restricted_insert" ON public.audit_logs
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR ((SELECT auth.role()) = 'service_role'::text)
);

-- =====================================================
-- 3. FIX VENDOR_DOCUMENTS - Add stricter project context
-- =====================================================
DROP POLICY IF EXISTS "vendor_documents_pm_select" ON public.vendor_documents;

-- Property managers can ONLY view documents from vendors on THEIR projects
CREATE POLICY "vendor_documents_pm_select" ON public.vendor_documents
FOR SELECT USING (
  (SELECT user_has_role('property_manager'))
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.assigned_vendor_id = vendor_documents.vendor_id
    AND p.status IN ('in_progress', 'completed')
    AND p.created_by = (SELECT auth.uid())  -- Only projects they created
  )
);

-- =====================================================
-- 4. FIX SECURITY_EVENTS - Restrict INSERT
-- =====================================================
DROP POLICY IF EXISTS "security_events_auth_insert" ON public.security_events;
DROP POLICY IF EXISTS "security_events_service_insert" ON public.security_events;

-- Only service_role can insert security events
CREATE POLICY "security_events_service_insert" ON public.security_events
FOR INSERT WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text)
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- =====================================================
-- 5. FIX TEAM_MEMBERS - Restrict to admin/PM only
-- =====================================================
DROP POLICY IF EXISTS "team_members_auth_select" ON public.team_members;

-- Only admin and property managers can view team members
CREATE POLICY "team_members_auth_select" ON public.team_members
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
);

-- =====================================================
-- 6. FIX VENDOR_TIERS - Restrict to relevant parties
-- =====================================================
DROP POLICY IF EXISTS "vendor_tiers_authenticated_select" ON public.vendor_tiers;

CREATE POLICY "vendor_tiers_select" ON public.vendor_tiers
FOR SELECT USING (
  -- Vendor can see their own tier
  (vendor_id = (SELECT auth.uid()))
  -- Admin can see all
  OR (SELECT is_admin_user((SELECT auth.uid())))
  -- Property managers can see tiers
  OR (SELECT user_has_role('property_manager'))
);

-- =====================================================
-- 7. FIX NEWS_ANALYTICS - Restrict INSERT
-- =====================================================
DROP POLICY IF EXISTS "news_analytics_insert" ON public.news_analytics;

CREATE POLICY "news_analytics_insert" ON public.news_analytics
FOR INSERT WITH CHECK (
  -- User can only insert their own analytics
  (user_id = (SELECT auth.uid()) OR user_id IS NULL)
  AND (SELECT auth.uid()) IS NOT NULL
);

-- =====================================================
-- 8. FIX VENDOR_REVIEWS - Restrict vendor access
-- =====================================================
DROP POLICY IF EXISTS "vendor_reviews_select" ON public.vendor_reviews;

CREATE POLICY "vendor_reviews_select" ON public.vendor_reviews
FOR SELECT USING (
  -- Published reviews are public
  (status = 'published')
  -- Vendors can only see PUBLISHED reviews about them
  OR ((vendor_id = (SELECT auth.uid())) AND status = 'published')
  -- Reviewers can see their own reviews (any status)
  OR (reviewer_id = (SELECT auth.uid()))
  -- Admins see all
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- =====================================================
-- 9. FIX VENDOR_PROFILES - Restrict PM access to verified
-- =====================================================
DROP POLICY IF EXISTS "vendor_profiles_verified_select" ON public.vendor_profiles;

CREATE POLICY "vendor_profiles_select" ON public.vendor_profiles
FOR SELECT USING (
  -- Only verified vendors visible to public/PMs
  (is_verified = true)
  -- Owner can see their own profile
  OR (user_id = (SELECT auth.uid()))
  -- Admin sees all
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- =====================================================
-- 10. FIX VENDOR_PORTFOLIO_ITEMS - Restrict access
-- =====================================================
DROP POLICY IF EXISTS "vendor_portfolio_items_select" ON public.vendor_portfolio_items;

CREATE POLICY "vendor_portfolio_items_select" ON public.vendor_portfolio_items
FOR SELECT USING (
  -- Only items from verified vendors are public
  EXISTS (
    SELECT 1 FROM public.vendor_profiles vp
    WHERE vp.user_id = vendor_portfolio_items.vendor_id
    AND vp.is_verified = true
  )
  -- Or owner's own items
  OR (vendor_id = (SELECT auth.uid()))
  -- Or admin
  OR (SELECT is_admin_user((SELECT auth.uid())))
);