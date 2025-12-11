-- =====================================================
-- COMPREHENSIVE SECURITY & PERFORMANCE REMEDIATION
-- Phase 1: Fix Performance Advisor Warnings
-- Phase 2: Fix Security Findings
-- =====================================================

-- =====================================================
-- PHASE 1.1: PROPERTIES TABLE
-- Fix auth_rls_initplan + consolidate multiple SELECT policies
-- =====================================================
DROP POLICY IF EXISTS "properties_authenticated_select" ON public.properties;
DROP POLICY IF EXISTS "properties_authenticated_view" ON public.properties;
DROP POLICY IF EXISTS "properties_public_view_available" ON public.properties;

-- Single optimized SELECT policy
CREATE POLICY "properties_unified_select" ON public.properties
FOR SELECT USING (
  (status = 'available')
  OR ((SELECT auth.uid()) IS NOT NULL AND status = 'available')
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
  OR (owner_id = (SELECT auth.uid())::text)
);

-- =====================================================
-- PHASE 1.2: AUDIT_LOGS TABLE
-- Fix auth_rls_initplan + strengthen INSERT policy
-- =====================================================
DROP POLICY IF EXISTS "audit_logs_restricted_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_unified_select" ON public.audit_logs;

CREATE POLICY "audit_logs_restricted_insert" ON public.audit_logs
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR ((SELECT auth.role()) = 'service_role'::text)
  OR (
    (SELECT auth.uid()) IS NOT NULL 
    AND user_id = (SELECT auth.uid()) 
    AND user_id IS NOT NULL
  )
);

-- Admin-only SELECT for security
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
FOR SELECT USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- =====================================================
-- PHASE 1.3: FINANCIAL_REPORTS TABLE
-- Fix all 3 auth_rls_initplan policies
-- =====================================================
DROP POLICY IF EXISTS "financial_reports_admin_update" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_auth_insert" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_auth_select" ON public.financial_reports;

CREATE POLICY "financial_reports_admin_update" ON public.financial_reports
FOR UPDATE USING ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "financial_reports_auth_insert" ON public.financial_reports
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
);

CREATE POLICY "financial_reports_auth_select" ON public.financial_reports
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role('property_manager'))
  OR (generated_by = (SELECT auth.uid()))
);

-- =====================================================
-- PHASE 1.4: SECURITY_EVENTS TABLE
-- Fix auth_rls_initplan
-- =====================================================
DROP POLICY IF EXISTS "security_events_admin_only_select" ON public.security_events;

CREATE POLICY "security_events_admin_only_select" ON public.security_events
FOR SELECT USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- =====================================================
-- PHASE 1.5: RSS_FEED_SOURCES TABLE
-- Fix auth_rls_initplan
-- =====================================================
DROP POLICY IF EXISTS "rss_feeds_admin_only" ON public.rss_feed_sources;

CREATE POLICY "rss_feeds_admin_only" ON public.rss_feed_sources
FOR ALL USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- =====================================================
-- PHASE 1.6: STRIPE TABLES
-- Consolidate multiple SELECT policies + fix auth_rls_initplan
-- =====================================================

-- STRIPE_CUSTOMERS
DROP POLICY IF EXISTS "stripe_customers_admin_select" ON public.stripe_customers;
DROP POLICY IF EXISTS "stripe_customers_own_select" ON public.stripe_customers;

CREATE POLICY "stripe_customers_unified_select" ON public.stripe_customers
FOR SELECT USING (
  (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- STRIPE_PAYMENTS
DROP POLICY IF EXISTS "stripe_payments_admin_select" ON public.stripe_payments;
DROP POLICY IF EXISTS "stripe_payments_own_select" ON public.stripe_payments;

CREATE POLICY "stripe_payments_unified_select" ON public.stripe_payments
FOR SELECT USING (
  (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- STRIPE_SUBSCRIPTIONS
DROP POLICY IF EXISTS "stripe_subscriptions_admin_select" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "stripe_subscriptions_own_select" ON public.stripe_subscriptions;

CREATE POLICY "stripe_subscriptions_unified_select" ON public.stripe_subscriptions
FOR SELECT USING (
  (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);