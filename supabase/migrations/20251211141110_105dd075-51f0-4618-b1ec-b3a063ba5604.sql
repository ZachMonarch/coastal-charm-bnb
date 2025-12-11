-- =====================================================
-- PHASE 1 CONTINUED: Fix remaining auth_rls_initplan warnings
-- =====================================================

-- =====================================================
-- VENDOR_PAYMENT_METHODS TABLE
-- Fix all 4 auth_rls_initplan policies + consolidate
-- =====================================================
DROP POLICY IF EXISTS "vendor_payment_methods_own_delete" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_own_insert" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_own_select" ON public.vendor_payment_methods;
DROP POLICY IF EXISTS "vendor_payment_methods_own_update" ON public.vendor_payment_methods;

CREATE POLICY "vendor_payment_methods_unified_access" ON public.vendor_payment_methods
FOR ALL USING (vendor_id = (SELECT auth.uid()))
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- =====================================================
-- VENDOR_TIERS TABLE
-- Fix auth_rls_initplan
-- =====================================================
DROP POLICY IF EXISTS "vendor_tiers_authenticated_select" ON public.vendor_tiers;

CREATE POLICY "vendor_tiers_authenticated_select" ON public.vendor_tiers
FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- TEAM_MEMBERS TABLE
-- Fix all 4 auth_rls_initplan policies + consolidate
-- =====================================================
DROP POLICY IF EXISTS "team_members_admin_delete" ON public.team_members;
DROP POLICY IF EXISTS "team_members_admin_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_admin_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_auth_select" ON public.team_members;

CREATE POLICY "team_members_admin_manage" ON public.team_members
FOR ALL USING ((SELECT is_admin_user((SELECT auth.uid()))))
WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "team_members_auth_select" ON public.team_members
FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================
-- PHASE 2: SECURITY HARDENING
-- =====================================================

-- =====================================================
-- VENDOR_DOCUMENTS TABLE - Restrict to relevant parties
-- =====================================================
DROP POLICY IF EXISTS "vendor_documents_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_select" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_insert" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_update" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_delete" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_own_access" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_admin_select" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_pm_select" ON public.vendor_documents;

-- Vendors manage their own documents
CREATE POLICY "vendor_documents_own_access" ON public.vendor_documents
FOR ALL USING (vendor_id = (SELECT auth.uid()))
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- Admins can view all
CREATE POLICY "vendor_documents_admin_select" ON public.vendor_documents
FOR SELECT USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- Property managers can view documents from vendors with active relationships
CREATE POLICY "vendor_documents_pm_select" ON public.vendor_documents
FOR SELECT USING (
  (SELECT user_has_role('property_manager'))
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.assigned_vendor_id = vendor_documents.vendor_id
    AND p.status IN ('in_progress', 'completed')
  )
);

-- =====================================================
-- VENDOR_PROFILES TABLE - Protect sensitive data
-- =====================================================
DROP POLICY IF EXISTS "vendor_profiles_public_view" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_select" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_verified_select" ON public.vendor_profiles;

-- Verified vendors visible to public (limited data via app layer)
CREATE POLICY "vendor_profiles_verified_select" ON public.vendor_profiles
FOR SELECT USING (
  (is_verified = true)
  OR (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
);

-- =====================================================
-- VENDOR_REVIEWS TABLE - Hide unpublished from public
-- =====================================================
DROP POLICY IF EXISTS "vendor_reviews_select" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_public_select" ON public.vendor_reviews;

CREATE POLICY "vendor_reviews_select" ON public.vendor_reviews
FOR SELECT USING (
  (status = 'published')
  OR (vendor_id = (SELECT auth.uid()))
  OR (reviewer_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- =====================================================
-- VENDOR_INVITATIONS TABLE - Admin management
-- =====================================================
DROP POLICY IF EXISTS "vendor_invitations_select" ON public.vendor_invitations;
DROP POLICY IF EXISTS "vendor_invitations_insert" ON public.vendor_invitations;
DROP POLICY IF EXISTS "vendor_invitations_update" ON public.vendor_invitations;
DROP POLICY IF EXISTS "vendor_invitations_admin_manage" ON public.vendor_invitations;
DROP POLICY IF EXISTS "vendor_invitations_own_select" ON public.vendor_invitations;

-- Admin can manage all invitations
CREATE POLICY "vendor_invitations_admin_manage" ON public.vendor_invitations
FOR ALL USING ((SELECT is_admin_user((SELECT auth.uid()))))
WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

-- Invited users can see their own invitations
CREATE POLICY "vendor_invitations_own_select" ON public.vendor_invitations
FOR SELECT USING (
  email = (SELECT email FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1)
);

-- =====================================================
-- VENDOR_PAYOUTS TABLE - Restrict access
-- =====================================================
DROP POLICY IF EXISTS "vendor_payouts_select" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_admin" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_unified_access" ON public.vendor_payouts;

CREATE POLICY "vendor_payouts_unified_access" ON public.vendor_payouts
FOR ALL USING (
  (vendor_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
)
WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));