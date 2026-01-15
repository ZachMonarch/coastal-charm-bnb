-- =====================================================
-- COMPLETE RLS PERFORMANCE OPTIMIZATION
-- Corrected schema-aware migration
-- =====================================================

-- 3.1 vendor_profiles (use is_verified instead of status)
DROP POLICY IF EXISTS "Vendors manage own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_select_own" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_select_staff" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_unified_select" ON public.vendor_profiles;
DROP POLICY IF EXISTS "vendor_profiles_unified_select_v2" ON public.vendor_profiles;

CREATE POLICY "vendor_profiles_unified_select_v2" ON public.vendor_profiles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_verified = true
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

-- Keep insert/update for own profile
DROP POLICY IF EXISTS "vendor_profiles_insert_own" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_insert_own" ON public.vendor_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "vendor_profiles_update_own" ON public.vendor_profiles;
CREATE POLICY "vendor_profiles_update_own" ON public.vendor_profiles
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- 3.2 transactions (consolidate policies)
DROP POLICY IF EXISTS "transactions_manage_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_unified_manage" ON public.transactions;
DROP POLICY IF EXISTS "transactions_prevent_delete" ON public.transactions;
DROP POLICY IF EXISTS "transactions_unified" ON public.transactions;

CREATE POLICY "transactions_unified" ON public.transactions
FOR ALL TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

-- Prevent delete (except admin)
CREATE POLICY "transactions_prevent_delete" ON public.transactions
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.3 subscribers (consolidate policies)
DROP POLICY IF EXISTS "consolidated_subscribers_delete" ON public.subscribers;
DROP POLICY IF EXISTS "consolidated_subscribers_insert" ON public.subscribers;
DROP POLICY IF EXISTS "consolidated_subscribers_select" ON public.subscribers;
DROP POLICY IF EXISTS "consolidated_subscribers_update" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_access" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_unified" ON public.subscribers;

CREATE POLICY "subscribers_unified" ON public.subscribers
FOR ALL TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.4 vendor_bids (consolidate SELECT policies)
DROP POLICY IF EXISTS "vendor_bids_select_own" ON public.vendor_bids;
DROP POLICY IF EXISTS "vendor_bids_select_staff" ON public.vendor_bids;
DROP POLICY IF EXISTS "vendor_bids_unified_select" ON public.vendor_bids;

CREATE POLICY "vendor_bids_unified_select" ON public.vendor_bids
FOR SELECT TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

-- 3.5 vendor_documents (consolidate policies)
DROP POLICY IF EXISTS "vendor_documents_delete_own" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_insert_own" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_select_own" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_select_staff" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_unified" ON public.vendor_documents;

CREATE POLICY "vendor_documents_unified" ON public.vendor_documents
FOR ALL TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- 3.6 rfqs (consolidate SELECT policies - status exists in rfqs)
DROP POLICY IF EXISTS "rfqs_select_creator" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_invited" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_select_staff" ON public.rfqs;
DROP POLICY IF EXISTS "rfqs_unified_select" ON public.rfqs;

CREATE POLICY "rfqs_unified_select" ON public.rfqs
FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR status = 'published'
  OR EXISTS (
    SELECT 1 FROM public.rfq_invites 
    WHERE rfq_id = rfqs.id 
    AND vendor_id IN (
      SELECT id FROM public.vendor_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

-- 3.7 projects (consolidate SELECT policies)
DROP POLICY IF EXISTS "projects_select_creator" ON public.projects;
DROP POLICY IF EXISTS "projects_select_assigned" ON public.projects;
DROP POLICY IF EXISTS "projects_select_staff" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_select" ON public.projects;

CREATE POLICY "projects_unified_select" ON public.projects
FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR assigned_vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

-- 3.8 vendor_reviews policies (use reviewer_id per schema)
DROP POLICY IF EXISTS "vendor_reviews_delete_admin" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_insert_reviewer" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_insert" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_select_admin" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_select_vendor" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_update_admin" ON public.vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_unified_select" ON public.vendor_reviews;

CREATE POLICY "vendor_reviews_unified_select" ON public.vendor_reviews
FOR SELECT TO authenticated
USING (
  reviewer_id = (SELECT auth.uid())
  OR vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

CREATE POLICY "vendor_reviews_insert" ON public.vendor_reviews
FOR INSERT TO authenticated
WITH CHECK (reviewer_id = (SELECT auth.uid()));

CREATE POLICY "vendor_reviews_manage_admin" ON public.vendor_reviews
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.9 vendor_tiers policies (uses vendor_id per schema)
DROP POLICY IF EXISTS "vendor_tiers_manage_system" ON public.vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_select_own" ON public.vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_select_staff" ON public.vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_unified_select" ON public.vendor_tiers;

CREATE POLICY "vendor_tiers_unified_select" ON public.vendor_tiers
FOR SELECT TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

CREATE POLICY "vendor_tiers_manage_admin" ON public.vendor_tiers
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.10 vendor_portfolio_items policies
DROP POLICY IF EXISTS "vendor_portfolio_items_delete_own" ON public.vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_items_insert_own" ON public.vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_items_select_own" ON public.vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_items_update_own" ON public.vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_items_unified" ON public.vendor_portfolio_items;

CREATE POLICY "vendor_portfolio_items_unified" ON public.vendor_portfolio_items
FOR ALL TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- 3.11 stripe_customers policies
DROP POLICY IF EXISTS "stripe_customers_admin_service_insert" ON public.stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_admin_service_update" ON public.stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_unified" ON public.stripe_customers;

CREATE POLICY "stripe_customers_unified" ON public.stripe_customers
FOR ALL TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.12 stripe_subscriptions policies
DROP POLICY IF EXISTS "stripe_subscriptions_admin_service_insert" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_admin_service_update" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_unified" ON public.stripe_subscriptions;

CREATE POLICY "stripe_subscriptions_unified" ON public.stripe_subscriptions
FOR ALL TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.13 stripe_payments policies
DROP POLICY IF EXISTS "stripe_payments_admin_service_insert" ON public.stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_admin_service_update" ON public.stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_unified" ON public.stripe_payments;

CREATE POLICY "stripe_payments_unified" ON public.stripe_payments
FOR ALL TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  )
);

-- 3.14 vendor_lead_matches policies
DROP POLICY IF EXISTS "vendor_lead_matches_select_vendor" ON public.vendor_lead_matches;
DROP POLICY IF EXISTS "vendor_lead_matches_unified" ON public.vendor_lead_matches;

CREATE POLICY "vendor_lead_matches_unified" ON public.vendor_lead_matches
FOR ALL TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendor_profiles 
    WHERE user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'property_manager')
  )
);

-- =====================================================
-- PHASE 4: Add performance indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_verified ON public.vendor_profiles(user_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_assigned ON public.work_orders(created_by, assigned_to);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor_id ON public.vendor_bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfq_invites_vendor_id ON public.rfq_invites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_assigned ON public.projects(created_by, assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_reviewer ON public.vendor_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor ON public.vendor_reviews(vendor_id);