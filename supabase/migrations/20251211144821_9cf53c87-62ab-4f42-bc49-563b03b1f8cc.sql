-- =====================================================
-- PHASE A: Consolidate Duplicate RLS Policies (47 warnings)
-- Fix multiple_permissive_policies for 8 tables
-- =====================================================

-- ===================
-- A.1: audit_logs (3 duplicate SELECT policies)
-- ===================
DROP POLICY IF EXISTS "audit_logs_admin_only_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;

CREATE POLICY "audit_logs_unified_select" ON public.audit_logs
FOR SELECT USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- ===================
-- A.2: profiles (2 duplicate UPDATE policies)
-- ===================
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure_update" ON public.profiles;

CREATE POLICY "profiles_unified_update" ON public.profiles
FOR UPDATE 
USING ((id = (SELECT auth.uid())) OR (SELECT is_admin_user((SELECT auth.uid()))))
WITH CHECK ((id = (SELECT auth.uid())) OR (SELECT is_admin_user((SELECT auth.uid()))));

-- ===================
-- A.3: team_members (2 duplicate SELECT policies)
-- ===================
DROP POLICY IF EXISTS "team_members_admin_manage" ON public.team_members;
DROP POLICY IF EXISTS "team_members_auth_select" ON public.team_members;

-- Create unified SELECT policy
CREATE POLICY "team_members_unified_select" ON public.team_members
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
);

-- Admin can do all operations
CREATE POLICY "team_members_admin_manage_all" ON public.team_members
FOR ALL USING ((SELECT is_admin_user((SELECT auth.uid()))))
WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

-- ===================
-- A.4: vendor_documents (7 duplicate policies across operations)
-- ===================
DROP POLICY IF EXISTS "vendor_documents_own_access" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_admin_select" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_pm_select" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_select_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_insert_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_update_policy" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_delete_policy" ON public.vendor_documents;

-- Single unified SELECT policy
CREATE POLICY "vendor_documents_unified_select" ON public.vendor_documents
FOR SELECT USING (
  (vendor_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
);

-- Single unified INSERT policy
CREATE POLICY "vendor_documents_unified_insert" ON public.vendor_documents
FOR INSERT WITH CHECK (
  (vendor_id = (SELECT auth.uid())) OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- Single unified UPDATE policy
CREATE POLICY "vendor_documents_unified_update" ON public.vendor_documents
FOR UPDATE USING (
  (vendor_id = (SELECT auth.uid())) OR (SELECT is_admin_user((SELECT auth.uid())))
)
WITH CHECK (
  (vendor_id = (SELECT auth.uid())) OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- Single unified DELETE policy
CREATE POLICY "vendor_documents_unified_delete" ON public.vendor_documents
FOR DELETE USING (
  (vendor_id = (SELECT auth.uid())) OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- ===================
-- A.5: vendor_invitations (5 duplicate policies)
-- ===================
DROP POLICY IF EXISTS "admin_manage_invitations" ON public.vendor_invitations;
DROP POLICY IF EXISTS "vendor_invitations_admin_manage" ON public.vendor_invitations;
DROP POLICY IF EXISTS "vendor_invitations_own_select" ON public.vendor_invitations;

-- Admin full access
CREATE POLICY "vendor_invitations_admin_all" ON public.vendor_invitations
FOR ALL 
USING ((SELECT is_admin_user((SELECT auth.uid()))))
WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

-- Invitee can view their own invitations by email
CREATE POLICY "vendor_invitations_own_view" ON public.vendor_invitations
FOR SELECT USING (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
);

-- ===================
-- A.6: vendor_payouts (5 duplicate policies)
-- ===================
DROP POLICY IF EXISTS "vendor_payouts_unified_access" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_admin_delete" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_admin_insert" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_admin_update" ON public.vendor_payouts;
DROP POLICY IF EXISTS "vendor_payouts_unified_select" ON public.vendor_payouts;

-- Single unified policy for all operations
CREATE POLICY "vendor_payouts_unified_all" ON public.vendor_payouts
FOR ALL 
USING (
  (vendor_id = (SELECT auth.uid())) 
  OR (SELECT is_admin_user((SELECT auth.uid())))
)
WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

-- ===================
-- A.7: vendor_portfolio_items (2 duplicate SELECT policies)
-- ===================
DROP POLICY IF EXISTS "vendor_portfolio_items_select" ON public.vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_unified_select" ON public.vendor_portfolio_items;

-- Single unified SELECT policy
CREATE POLICY "vendor_portfolio_items_unified_select" ON public.vendor_portfolio_items
FOR SELECT USING (
  (vendor_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (EXISTS (
    SELECT 1 FROM vendor_profiles vp 
    WHERE vp.user_id = vendor_portfolio_items.vendor_id AND vp.is_verified = true
  ))
);

-- ===================
-- A.8: vendor_profiles (2 duplicate SELECT policies)
-- ===================
DROP POLICY IF EXISTS "vendor_profiles_select" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_unified_select" ON public.vendor_profiles;

-- Single unified SELECT policy
CREATE POLICY "vendor_profiles_unified_select" ON public.vendor_profiles
FOR SELECT USING (
  (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (is_verified = true)
);