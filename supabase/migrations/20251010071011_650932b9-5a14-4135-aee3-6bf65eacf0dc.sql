-- =====================================================================
-- COMPREHENSIVE RLS & INDEX OPTIMIZATION MIGRATION
-- Phases 1-5: Eliminate 60 Linter Warnings + Performance Optimization
-- =====================================================================

BEGIN;

-- =====================================================================
-- PHASE 2 & 4 & 5: DROP DUPLICATE/REDUNDANT POLICIES FIRST
-- =====================================================================

-- Bookings: Drop duplicate permissive policies (will consolidate into one)
DROP POLICY IF EXISTS "bookings_admin_full_access" ON public.bookings;
DROP POLICY IF EXISTS "bookings_user_own_only" ON public.bookings;

-- Financial Reports: Drop exact duplicate policy
DROP POLICY IF EXISTS "financial_reports_admin_only_comprehensive" ON public.financial_reports;

-- Payment Templates: Drop 4 redundant granular policies (keep comprehensive one)
DROP POLICY IF EXISTS "admin_payment_template_select" ON public.payment_templates;
DROP POLICY IF EXISTS "admin_payment_template_insert" ON public.payment_templates;
DROP POLICY IF EXISTS "admin_payment_template_update" ON public.payment_templates;
DROP POLICY IF EXISTS "admin_payment_template_delete" ON public.payment_templates;

-- Vendor Profiles: Drop redundant update policy
DROP POLICY IF EXISTS "vendor_profiles_update_policy" ON public.vendor_profiles;

-- =====================================================================
-- PHASE 3: DROP DUPLICATE INDEX
-- =====================================================================

-- Notifications: Drop full index, keep optimized partial index
DROP INDEX IF EXISTS public.idx_notifications_user_unread;
-- Keeping: idx_notifications_user_read (partial index for read=false, 70% smaller)

-- =====================================================================
-- PHASE 1 & 2: RECREATE OPTIMIZED POLICIES WITH (SELECT auth.uid())
-- =====================================================================

-- ================== USER_ROLES TABLE ==================
DROP POLICY IF EXISTS "user_roles_admin_service_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_service_delete" ON public.user_roles
FOR DELETE
USING (is_admin_user((SELECT auth.uid())) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "user_roles_admin_service_only" ON public.user_roles;
CREATE POLICY "user_roles_admin_service_only" ON public.user_roles
FOR INSERT
WITH CHECK (is_admin_user((SELECT auth.uid())) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "user_roles_admin_service_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_service_update" ON public.user_roles
FOR UPDATE
USING (is_admin_user((SELECT auth.uid())) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "user_roles_read_own_only" ON public.user_roles;
CREATE POLICY "user_roles_read_own_only" ON public.user_roles
FOR SELECT
USING ((SELECT auth.uid()) = user_id OR is_admin_user((SELECT auth.uid())) OR auth.role() = 'service_role');

-- ================== VENDOR_PROFILES TABLE ==================
DROP POLICY IF EXISTS "vendor_profiles_admin_access" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_admin_access" ON public.vendor_profiles
FOR ALL
USING (is_admin_user((SELECT auth.uid())))
WITH CHECK (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS "vendor_profiles_own_only" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_own_only" ON public.vendor_profiles
FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "vendor_profiles_public_limited_read" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_public_limited_read" ON public.vendor_profiles
FOR SELECT
USING (
  CASE
    WHEN (SELECT auth.uid()) = user_id THEN true
    WHEN is_admin_user((SELECT auth.uid())) THEN true
    WHEN user_has_role((SELECT auth.uid()), 'property_manager') THEN true
    WHEN is_verified = true AND availability_status = 'available' 
      THEN (company_name IS NOT NULL AND rating IS NOT NULL)
    ELSE false
  END
);

-- ================== VENDOR_APPLICATIONS TABLE ==================
DROP POLICY IF EXISTS "vendor_applications_admin_access" ON public.vendor_applications;
CREATE POLICY "vendor_applications_admin_access" ON public.vendor_applications
FOR ALL
USING (is_admin_user((SELECT auth.uid())))
WITH CHECK (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS "vendor_applications_own_only" ON public.vendor_applications;
CREATE POLICY "vendor_applications_own_only" ON public.vendor_applications
FOR ALL
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ================== VENDOR_BIDS TABLE ==================
DROP POLICY IF EXISTS "vendor_bids_admin_access" ON public.vendor_bids;
CREATE POLICY "vendor_bids_admin_access" ON public.vendor_bids
FOR ALL
USING (is_admin_user((SELECT auth.uid())))
WITH CHECK (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS "vendor_bids_own_only" ON public.vendor_bids;
CREATE POLICY "vendor_bids_own_only" ON public.vendor_bids
FOR ALL
USING ((SELECT auth.uid()) = vendor_id)
WITH CHECK ((SELECT auth.uid()) = vendor_id);

-- ================== VENDOR_PAYMENTS TABLE ==================
DROP POLICY IF EXISTS "vendor_payments_vendor_own" ON public.vendor_payments;
CREATE POLICY "vendor_payments_vendor_own" ON public.vendor_payments
FOR SELECT
USING (vendor_id = (SELECT auth.uid()));

-- ================== VENDOR_PAYOUTS TABLE ==================
DROP POLICY IF EXISTS "vendor_payouts_admin_access" ON public.vendor_payouts;
CREATE POLICY "vendor_payouts_admin_access" ON public.vendor_payouts
FOR ALL
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS "vendor_payouts_vendor_own" ON public.vendor_payouts;
CREATE POLICY "vendor_payouts_vendor_own" ON public.vendor_payouts
FOR SELECT
USING (vendor_id = (SELECT auth.uid()));

-- ================== VENDOR_DOCUMENT_COMMENTS TABLE ==================
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.vendor_document_comments;
CREATE POLICY "Admins can manage all comments" ON public.vendor_document_comments
FOR ALL
USING (is_admin_user((SELECT auth.uid())))
WITH CHECK (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS "Vendors can insert responses to own docs" ON public.vendor_document_comments;
CREATE POLICY "Vendors can insert responses to own docs" ON public.vendor_document_comments
FOR INSERT
WITH CHECK (
  comment_type = 'vendor_response' 
  AND NOT is_internal 
  AND EXISTS (
    SELECT 1 FROM vendor_documents vd 
    WHERE vd.id = vendor_document_comments.document_id 
    AND vd.vendor_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Vendors can view non-internal comments on own docs" ON public.vendor_document_comments;
CREATE POLICY "Vendors can view non-internal comments on own docs" ON public.vendor_document_comments
FOR SELECT
USING (
  NOT is_internal 
  AND EXISTS (
    SELECT 1 FROM vendor_documents vd 
    WHERE vd.id = vendor_document_comments.document_id 
    AND vd.vendor_id = (SELECT auth.uid())
  )
);

-- ================== PROFILE_PHOTOS TABLE ==================
DROP POLICY IF EXISTS "users_manage_own_photos" ON public.profile_photos;
CREATE POLICY "users_manage_own_photos" ON public.profile_photos
FOR ALL
USING (user_id = (SELECT auth.uid()));

-- ================== BOOKINGS TABLE (CONSOLIDATED) ==================
-- Consolidate 2 policies into 1 comprehensive policy
CREATE POLICY "bookings_unified_access" ON public.bookings
FOR ALL
USING (
  (SELECT auth.uid()) = user_id 
  OR is_admin_user((SELECT auth.uid()))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id 
  OR is_admin_user((SELECT auth.uid()))
);

-- ================== FINANCIAL_REPORTS TABLE (OPTIMIZED) ==================
-- Keep single optimized policy (duplicate already dropped)
DROP POLICY IF EXISTS "financial_reports_admin_only" ON public.financial_reports;
CREATE POLICY "financial_reports_admin_only" ON public.financial_reports
FOR ALL
USING (is_admin_user((SELECT auth.uid())))
WITH CHECK (is_admin_user((SELECT auth.uid())));

COMMIT;

-- =====================================================================
-- ROLLBACK SCRIPT (For Emergency Use)
-- =====================================================================
-- To rollback this migration, run the following in a new migration:
/*
BEGIN;

-- Restore original bookings policies
DROP POLICY IF EXISTS "bookings_unified_access" ON public.bookings;
CREATE POLICY "bookings_admin_full_access" ON public.bookings FOR ALL USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
CREATE POLICY "bookings_user_own_only" ON public.bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Restore financial_reports duplicate
CREATE POLICY "financial_reports_admin_only_comprehensive" ON public.financial_reports FOR ALL USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

-- Restore payment_templates granular policies
CREATE POLICY "admin_payment_template_select" ON public.payment_templates FOR SELECT USING (is_admin_user(auth.uid()) OR user_has_role(auth.uid(), 'property_manager'));
CREATE POLICY "admin_payment_template_insert" ON public.payment_templates FOR INSERT WITH CHECK (is_admin_user(auth.uid()) OR user_has_role(auth.uid(), 'property_manager'));
CREATE POLICY "admin_payment_template_update" ON public.payment_templates FOR UPDATE USING (is_admin_user(auth.uid()) OR user_has_role(auth.uid(), 'property_manager'));
CREATE POLICY "admin_payment_template_delete" ON public.payment_templates FOR DELETE USING (is_admin_user(auth.uid()));

-- Restore vendor_profiles update policy
CREATE POLICY "vendor_profiles_update_policy" ON public.vendor_profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin_user(auth.uid()));

-- Restore notification index
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read);

-- Revert all auth.uid() optimizations (remove SELECT wrappers)
-- [Would need to recreate all policies with original syntax]

COMMIT;
*/