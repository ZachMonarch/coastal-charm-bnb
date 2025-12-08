-- =====================================================
-- COMPREHENSIVE RLS POLICY CONSOLIDATION
-- Fixes 48 "Multiple Permissive Policies" warnings
-- Strategy: Drop overlapping policies, create single policy per operation
-- =====================================================

-- =====================================================
-- PHASE 1: PUBLIC SCHEMA TABLES
-- =====================================================

-- -----------------------------------------------------
-- 1.1 public.bid_scores
-- -----------------------------------------------------
DROP POLICY IF EXISTS "bid_scores_modify" ON public.bid_scores;
DROP POLICY IF EXISTS "bid_scores_select" ON public.bid_scores;

CREATE POLICY "bid_scores_unified_select" ON public.bid_scores
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
  OR EXISTS (SELECT 1 FROM vendor_bids vb WHERE vb.id = bid_scores.bid_id AND vb.vendor_id = (SELECT auth.uid()))
);

CREATE POLICY "bid_scores_unified_insert" ON public.bid_scores
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

CREATE POLICY "bid_scores_unified_update" ON public.bid_scores
FOR UPDATE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

CREATE POLICY "bid_scores_unified_delete" ON public.bid_scores
FOR DELETE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

-- -----------------------------------------------------
-- 1.2 public.news_articles
-- -----------------------------------------------------
DROP POLICY IF EXISTS "news_articles_modify" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_select" ON public.news_articles;

CREATE POLICY "news_articles_unified_select" ON public.news_articles
FOR SELECT USING (is_published = true OR (SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "news_articles_unified_insert" ON public.news_articles
FOR INSERT WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "news_articles_unified_update" ON public.news_articles
FOR UPDATE USING ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "news_articles_unified_delete" ON public.news_articles
FOR DELETE USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- -----------------------------------------------------
-- 1.3 public.rfq_templates
-- -----------------------------------------------------
DROP POLICY IF EXISTS "rfq_templates_modify" ON public.rfq_templates;
DROP POLICY IF EXISTS "rfq_templates_select" ON public.rfq_templates;

CREATE POLICY "rfq_templates_unified_select" ON public.rfq_templates
FOR SELECT USING (is_active = true OR (SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "rfq_templates_unified_insert" ON public.rfq_templates
FOR INSERT WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "rfq_templates_unified_update" ON public.rfq_templates
FOR UPDATE USING ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "rfq_templates_unified_delete" ON public.rfq_templates
FOR DELETE USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- -----------------------------------------------------
-- 1.4 public.rss_feed_sources
-- -----------------------------------------------------
DROP POLICY IF EXISTS "rss_feeds_modify" ON public.rss_feed_sources;
DROP POLICY IF EXISTS "rss_feeds_select" ON public.rss_feed_sources;

CREATE POLICY "rss_feeds_unified_select" ON public.rss_feed_sources
FOR SELECT USING (is_active = true OR (SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "rss_feeds_unified_insert" ON public.rss_feed_sources
FOR INSERT WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "rss_feeds_unified_update" ON public.rss_feed_sources
FOR UPDATE USING ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "rss_feeds_unified_delete" ON public.rss_feed_sources
FOR DELETE USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- -----------------------------------------------------
-- 1.5 public.team_members
-- -----------------------------------------------------
DROP POLICY IF EXISTS "team_members_modify" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;

CREATE POLICY "team_members_unified_select" ON public.team_members
FOR SELECT USING (status = 'active' OR (SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "team_members_unified_insert" ON public.team_members
FOR INSERT WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "team_members_unified_update" ON public.team_members
FOR UPDATE USING ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "team_members_unified_delete" ON public.team_members
FOR DELETE USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- -----------------------------------------------------
-- 1.6 public.vendor_portfolio_items
-- -----------------------------------------------------
DROP POLICY IF EXISTS "vendor_portfolio_modify" ON public.vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_select" ON public.vendor_portfolio_items;

CREATE POLICY "vendor_portfolio_unified_select" ON public.vendor_portfolio_items
FOR SELECT USING (true);

CREATE POLICY "vendor_portfolio_unified_insert" ON public.vendor_portfolio_items
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_portfolio_items.vendor_id AND vp.user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "vendor_portfolio_unified_update" ON public.vendor_portfolio_items
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_portfolio_items.vendor_id AND vp.user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "vendor_portfolio_unified_delete" ON public.vendor_portfolio_items
FOR DELETE USING (
  EXISTS (SELECT 1 FROM vendor_profiles vp WHERE vp.id = vendor_portfolio_items.vendor_id AND vp.user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- -----------------------------------------------------
-- 1.7 public.vendor_tiers
-- -----------------------------------------------------
DROP POLICY IF EXISTS "vendor_tiers_modify" ON public.vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_select" ON public.vendor_tiers;

CREATE POLICY "vendor_tiers_unified_select" ON public.vendor_tiers
FOR SELECT USING (true);

CREATE POLICY "vendor_tiers_unified_insert" ON public.vendor_tiers
FOR INSERT WITH CHECK ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "vendor_tiers_unified_update" ON public.vendor_tiers
FOR UPDATE USING ((SELECT is_admin_user((SELECT auth.uid()))));

CREATE POLICY "vendor_tiers_unified_delete" ON public.vendor_tiers
FOR DELETE USING ((SELECT is_admin_user((SELECT auth.uid()))));

-- -----------------------------------------------------
-- 1.8 public.work_orders
-- -----------------------------------------------------
DROP POLICY IF EXISTS "work_orders_tenant_staff" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_vendor_assigned" ON public.work_orders;

CREATE POLICY "work_orders_unified_select" ON public.work_orders
FOR SELECT USING (
  assigned_to = (SELECT auth.uid())
  OR (tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

CREATE POLICY "work_orders_unified_insert" ON public.work_orders
FOR INSERT WITH CHECK (
  tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager'))
);

CREATE POLICY "work_orders_unified_update" ON public.work_orders
FOR UPDATE USING (
  assigned_to = (SELECT auth.uid())
  OR (tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

CREATE POLICY "work_orders_unified_delete" ON public.work_orders
FOR DELETE USING (
  tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager'))
);

-- -----------------------------------------------------
-- 1.9 public.rfq_invites
-- -----------------------------------------------------
DROP POLICY IF EXISTS "rfq_invites_tenant_staff" ON public.rfq_invites;
DROP POLICY IF EXISTS "rfq_invites_vendor_own" ON public.rfq_invites;

CREATE POLICY "rfq_invites_unified_select" ON public.rfq_invites
FOR SELECT USING (
  vendor_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM rfqs r WHERE r.id = rfq_invites.rfq_id AND r.tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

CREATE POLICY "rfq_invites_unified_insert" ON public.rfq_invites
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM rfqs r WHERE r.id = rfq_invites.rfq_id AND r.tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

CREATE POLICY "rfq_invites_unified_update" ON public.rfq_invites
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM rfqs r WHERE r.id = rfq_invites.rfq_id AND r.tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

CREATE POLICY "rfq_invites_unified_delete" ON public.rfq_invites
FOR DELETE USING (
  EXISTS (SELECT 1 FROM rfqs r WHERE r.id = rfq_invites.rfq_id AND r.tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

-- =====================================================
-- PHASE 2: APP SCHEMA TABLES
-- =====================================================

-- -----------------------------------------------------
-- 2.1 app.bid_lines
-- -----------------------------------------------------
DROP POLICY IF EXISTS "bid_lines_owner_manage" ON app.bid_lines;
DROP POLICY IF EXISTS "bid_lines_tenant_admin_manage" ON app.bid_lines;
DROP POLICY IF EXISTS "bid_lines_vendor_insert" ON app.bid_lines;
DROP POLICY IF EXISTS "bid_lines_tenant_select" ON app.bid_lines;

CREATE POLICY "app_bid_lines_unified_select" ON app.bid_lines
FOR SELECT USING (
  EXISTS (SELECT 1 FROM app.bids b WHERE b.id = bid_lines.vendor_bid_id AND b.vendor_id = app.user_id())
  OR EXISTS (SELECT 1 FROM app.rfq_lots l JOIN app.rfqs r ON l.rfq_id = r.id WHERE l.id = bid_lines.lot_id AND r.tenant_id = app.current_tenant())
);

CREATE POLICY "app_bid_lines_unified_insert" ON app.bid_lines
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM app.bids b WHERE b.id = bid_lines.vendor_bid_id AND (b.vendor_id = app.user_id() OR app.has_role_v1('admin')))
);

CREATE POLICY "app_bid_lines_unified_update" ON app.bid_lines
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM app.bids b WHERE b.id = bid_lines.vendor_bid_id AND b.vendor_id = app.user_id())
  OR EXISTS (SELECT 1 FROM app.rfqs r JOIN app.rfq_lots l ON l.rfq_id = r.id WHERE l.id = bid_lines.lot_id AND r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))
);

CREATE POLICY "app_bid_lines_unified_delete" ON app.bid_lines
FOR DELETE USING (
  EXISTS (SELECT 1 FROM app.bids b WHERE b.id = bid_lines.vendor_bid_id AND b.vendor_id = app.user_id())
  OR EXISTS (SELECT 1 FROM app.rfqs r JOIN app.rfq_lots l ON l.rfq_id = r.id WHERE l.id = bid_lines.lot_id AND r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))
);

-- -----------------------------------------------------
-- 2.2 app.bids
-- -----------------------------------------------------
DROP POLICY IF EXISTS "bids_owner_manage" ON app.bids;
DROP POLICY IF EXISTS "bids_tenant_admin_manage" ON app.bids;
DROP POLICY IF EXISTS "bids_vendor_insert" ON app.bids;
DROP POLICY IF EXISTS "bids_vendor_select" ON app.bids;

CREATE POLICY "app_bids_unified_select" ON app.bids
FOR SELECT USING (
  vendor_id = app.user_id()
  OR EXISTS (SELECT 1 FROM app.rfqs r WHERE r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))
);

CREATE POLICY "app_bids_unified_insert" ON app.bids
FOR INSERT WITH CHECK (
  vendor_id = app.user_id() OR app.has_role_v1('admin')
);

CREATE POLICY "app_bids_unified_update" ON app.bids
FOR UPDATE USING (
  vendor_id = app.user_id()
  OR EXISTS (SELECT 1 FROM app.rfqs r WHERE r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))
);

CREATE POLICY "app_bids_unified_delete" ON app.bids
FOR DELETE USING (
  vendor_id = app.user_id()
  OR EXISTS (SELECT 1 FROM app.rfqs r WHERE r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))
);

-- -----------------------------------------------------
-- 2.3 app.rfq_invites
-- -----------------------------------------------------
DROP POLICY IF EXISTS "rfq_invites_owner_manage" ON app.rfq_invites;
DROP POLICY IF EXISTS "rfq_invites_tenant_admin_manage" ON app.rfq_invites;
DROP POLICY IF EXISTS "rfq_invites_tenant_insert" ON app.rfq_invites;
DROP POLICY IF EXISTS "rfq_invites_tenant_select" ON app.rfq_invites;

CREATE POLICY "app_rfq_invites_unified_select" ON app.rfq_invites
FOR SELECT USING (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_invites.rfq_id AND (r.created_by = app.user_id() OR r.tenant_id = app.current_tenant()))
);

CREATE POLICY "app_rfq_invites_unified_insert" ON app.rfq_invites
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_invites.rfq_id AND (r.created_by = app.user_id() OR (r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))))
);

CREATE POLICY "app_rfq_invites_unified_update" ON app.rfq_invites
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_invites.rfq_id AND (r.created_by = app.user_id() OR (r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))))
);

CREATE POLICY "app_rfq_invites_unified_delete" ON app.rfq_invites
FOR DELETE USING (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_invites.rfq_id AND (r.created_by = app.user_id() OR (r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))))
);

-- -----------------------------------------------------
-- 2.4 app.rfq_lots
-- -----------------------------------------------------
DROP POLICY IF EXISTS "rfq_lots_owner_manage" ON app.rfq_lots;
DROP POLICY IF EXISTS "rfq_lots_tenant_admin_manage" ON app.rfq_lots;
DROP POLICY IF EXISTS "rfq_lots_tenant_insert" ON app.rfq_lots;
DROP POLICY IF EXISTS "rfq_lots_tenant_select" ON app.rfq_lots;

CREATE POLICY "app_rfq_lots_unified_select" ON app.rfq_lots
FOR SELECT USING (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_lots.rfq_id AND (r.created_by = app.user_id() OR r.tenant_id = app.current_tenant()))
);

CREATE POLICY "app_rfq_lots_unified_insert" ON app.rfq_lots
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_lots.rfq_id AND (r.created_by = app.user_id() OR (r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))))
);

CREATE POLICY "app_rfq_lots_unified_update" ON app.rfq_lots
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_lots.rfq_id AND (r.created_by = app.user_id() OR (r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))))
);

CREATE POLICY "app_rfq_lots_unified_delete" ON app.rfq_lots
FOR DELETE USING (
  EXISTS (SELECT 1 FROM app.rfqs r WHERE r.id = rfq_lots.rfq_id AND (r.created_by = app.user_id() OR (r.tenant_id = app.current_tenant() AND app.has_role_v1('admin'))))
);

-- -----------------------------------------------------
-- 2.5 app.rfqs
-- -----------------------------------------------------
DROP POLICY IF EXISTS "rfqs_tenant_admin_manage" ON app.rfqs;
DROP POLICY IF EXISTS "rfqs_tenant_insert" ON app.rfqs;
DROP POLICY IF EXISTS "rfqs_tenant_select" ON app.rfqs;

CREATE POLICY "app_rfqs_unified_select" ON app.rfqs
FOR SELECT USING (tenant_id = app.current_tenant());

CREATE POLICY "app_rfqs_unified_insert" ON app.rfqs
FOR INSERT WITH CHECK (tenant_id = app.current_tenant());

CREATE POLICY "app_rfqs_unified_update" ON app.rfqs
FOR UPDATE USING (tenant_id = app.current_tenant() AND app.has_role_v1('admin'));

CREATE POLICY "app_rfqs_unified_delete" ON app.rfqs
FOR DELETE USING (tenant_id = app.current_tenant() AND app.has_role_v1('admin'));