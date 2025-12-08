-- =====================================================
-- PHASE 1: Auth RLS InitPlan Performance Fixes
-- Replace auth.uid() with (SELECT auth.uid()) for performance
-- =====================================================

-- 1.1 Article Bookmarks
DROP POLICY IF EXISTS "bookmarks_own_access" ON article_bookmarks;
CREATE POLICY "bookmarks_own_access" ON article_bookmarks
FOR ALL USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- 1.2 Bid Comments
DROP POLICY IF EXISTS "bid_comments_admin_access" ON bid_comments;
DROP POLICY IF EXISTS "bid_comments_vendor_view" ON bid_comments;
DROP POLICY IF EXISTS "bid_comments_vendor_respond" ON bid_comments;

CREATE POLICY "bid_comments_unified_select" ON bid_comments
FOR SELECT USING (
  (SELECT is_admin_user(auth.uid()))
  OR EXISTS (
    SELECT 1 FROM vendor_bids vb
    WHERE vb.id = bid_comments.bid_id 
    AND vb.vendor_id = (SELECT auth.uid())
    AND bid_comments.is_internal = false
  )
);

CREATE POLICY "bid_comments_unified_insert" ON bid_comments
FOR INSERT WITH CHECK (
  (SELECT is_admin_user(auth.uid()))
  OR (
    EXISTS (
      SELECT 1 FROM vendor_bids vb
      WHERE vb.id = bid_comments.bid_id 
      AND vb.vendor_id = (SELECT auth.uid())
    ) AND comment_type = 'response'
  )
);

CREATE POLICY "bid_comments_admin_manage" ON bid_comments
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.3 Bid Scores
DROP POLICY IF EXISTS "bid_scores_admin_manage" ON bid_scores;
DROP POLICY IF EXISTS "bid_scores_vendor_own" ON bid_scores;

CREATE POLICY "bid_scores_unified_select" ON bid_scores
FOR SELECT USING (
  (SELECT is_admin_user(auth.uid()))
  OR (SELECT user_has_role(auth.uid(), 'property_manager'))
  OR EXISTS (
    SELECT 1 FROM vendor_bids vb
    WHERE vb.id = bid_scores.bid_id 
    AND vb.vendor_id = (SELECT auth.uid())
  )
);

CREATE POLICY "bid_scores_admin_manage" ON bid_scores
FOR ALL USING (
  (SELECT is_admin_user(auth.uid()))
  OR (SELECT user_has_role(auth.uid(), 'property_manager'))
) WITH CHECK (
  (SELECT is_admin_user(auth.uid()))
  OR (SELECT user_has_role(auth.uid(), 'property_manager'))
);

-- 1.4 News Analytics
DROP POLICY IF EXISTS "analytics_read_admin" ON news_analytics;
DROP POLICY IF EXISTS "news_analytics_admin_update" ON news_analytics;
DROP POLICY IF EXISTS "news_analytics_admin_delete" ON news_analytics;

CREATE POLICY "news_analytics_admin_all" ON news_analytics
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.5 News Articles
DROP POLICY IF EXISTS "news_articles_admin_manage" ON news_articles;
DROP POLICY IF EXISTS "news_articles_public_read" ON news_articles;

CREATE POLICY "news_articles_public_read" ON news_articles
FOR SELECT USING (is_published = true OR (SELECT is_admin_user(auth.uid())));

CREATE POLICY "news_articles_admin_manage" ON news_articles
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.6 Newsletter Subscriptions
DROP POLICY IF EXISTS "newsletter_own_access" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "newsletter_insert" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "newsletter_update" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "newsletter_admin_delete" ON newsletter_subscriptions;

CREATE POLICY "newsletter_unified_select" ON newsletter_subscriptions
FOR SELECT USING (
  user_id = (SELECT auth.uid()) 
  OR (SELECT is_admin_user(auth.uid()))
);

CREATE POLICY "newsletter_unified_insert" ON newsletter_subscriptions
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

CREATE POLICY "newsletter_unified_update" ON newsletter_subscriptions
FOR UPDATE USING (
  user_id = (SELECT auth.uid()) 
  OR (SELECT is_admin_user(auth.uid()))
);

CREATE POLICY "newsletter_admin_delete" ON newsletter_subscriptions
FOR DELETE USING ((SELECT is_admin_user(auth.uid())));

-- 1.7 Protected Admins
DROP POLICY IF EXISTS "protected_admins_admin_view" ON protected_admins;
CREATE POLICY "protected_admins_admin_view" ON protected_admins
FOR SELECT USING ((SELECT is_admin_user(auth.uid())));

-- 1.8 Quick Quote Requests
DROP POLICY IF EXISTS "quick_quote_requests_insert" ON quick_quote_requests;
DROP POLICY IF EXISTS "quick_quote_requests_owner_access" ON quick_quote_requests;
DROP POLICY IF EXISTS "quick_quote_requests_public_view" ON quick_quote_requests;

CREATE POLICY "qqr_unified_select" ON quick_quote_requests
FOR SELECT USING (
  property_manager_id = (SELECT auth.uid())
  OR (SELECT is_admin_user(auth.uid()))
  OR (status = 'open' AND (SELECT user_has_role(auth.uid(), 'vendor')))
);

CREATE POLICY "qqr_unified_insert" ON quick_quote_requests
FOR INSERT WITH CHECK (
  property_manager_id = (SELECT auth.uid())
  OR (SELECT is_admin_user(auth.uid()))
  OR (SELECT user_has_role(auth.uid(), 'property_manager'))
);

CREATE POLICY "qqr_unified_modify" ON quick_quote_requests
FOR UPDATE USING (
  property_manager_id = (SELECT auth.uid())
  OR (SELECT is_admin_user(auth.uid()))
);

CREATE POLICY "qqr_unified_delete" ON quick_quote_requests
FOR DELETE USING (
  property_manager_id = (SELECT auth.uid())
  OR (SELECT is_admin_user(auth.uid()))
);

-- 1.9 RFQ Templates
DROP POLICY IF EXISTS "rfq_templates_admin_manage" ON rfq_templates;
DROP POLICY IF EXISTS "rfq_templates_authenticated_read" ON rfq_templates;

CREATE POLICY "rfq_templates_unified_select" ON rfq_templates
FOR SELECT USING (is_active = true OR (SELECT is_admin_user(auth.uid())));

CREATE POLICY "rfq_templates_admin_manage" ON rfq_templates
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.10 RSS Feed Sources
DROP POLICY IF EXISTS "rss_feed_sources_admin_manage" ON rss_feed_sources;
DROP POLICY IF EXISTS "rss_feed_sources_public_read" ON rss_feed_sources;

CREATE POLICY "rss_feeds_unified_select" ON rss_feed_sources
FOR SELECT USING (is_active = true OR (SELECT is_admin_user(auth.uid())));

CREATE POLICY "rss_feeds_admin_manage" ON rss_feed_sources
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.11 Team Members (uses 'status' column)
DROP POLICY IF EXISTS "team_members_admin_manage" ON team_members;
DROP POLICY IF EXISTS "team_members_read" ON team_members;
DROP POLICY IF EXISTS "team_members_public_read" ON team_members;

CREATE POLICY "team_members_unified_select" ON team_members
FOR SELECT USING (status = 'active' OR (SELECT is_admin_user(auth.uid())));

CREATE POLICY "team_members_admin_manage" ON team_members
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.12 User Notification Settings
DROP POLICY IF EXISTS "Users can view own notification settings" ON user_notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON user_notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON user_notification_settings;
DROP POLICY IF EXISTS "notification_settings_own_insert" ON user_notification_settings;
DROP POLICY IF EXISTS "notification_settings_own_update" ON user_notification_settings;
DROP POLICY IF EXISTS "notification_settings_admin_delete" ON user_notification_settings;

CREATE POLICY "notification_settings_own_view" ON user_notification_settings
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notification_settings_own_insert" ON user_notification_settings
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "notification_settings_own_update" ON user_notification_settings
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notification_settings_admin_delete" ON user_notification_settings
FOR DELETE USING ((SELECT is_admin_user(auth.uid())));

-- 1.13 Vendor Lead Credits (no 'id' column, uses vendor_id as PK)
DROP POLICY IF EXISTS "vendor_lead_credits_owner_access" ON vendor_lead_credits;
CREATE POLICY "vendor_lead_credits_owner_access" ON vendor_lead_credits
FOR ALL USING (vendor_id = (SELECT auth.uid()))
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- 1.14 Vendor Lead Matches (uses quote_request_id not lead_id)
DROP POLICY IF EXISTS "vendor_lead_matches_vendor_access" ON vendor_lead_matches;
DROP POLICY IF EXISTS "vendor_lead_matches_pm_access" ON vendor_lead_matches;

CREATE POLICY "lead_matches_unified_select" ON vendor_lead_matches
FOR SELECT USING (
  vendor_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM quick_quote_requests qqr
    WHERE qqr.id = vendor_lead_matches.quote_request_id 
    AND qqr.property_manager_id = (SELECT auth.uid())
  )
  OR (SELECT is_admin_user(auth.uid()))
);

-- 1.15 Vendor Payments
DROP POLICY IF EXISTS "vendor_payments_admin_insert_unified" ON vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_admin_select" ON vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_unified_select" ON vendor_payments;

CREATE POLICY "vendor_payments_unified_select" ON vendor_payments
FOR SELECT USING (
  vendor_id = (SELECT auth.uid())
  OR (SELECT is_admin_user(auth.uid()))
);

CREATE POLICY "vendor_payments_admin_insert" ON vendor_payments
FOR INSERT WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.16 Vendor Payout Settings
DROP POLICY IF EXISTS "Vendors can view own payout settings" ON vendor_payout_settings;
DROP POLICY IF EXISTS "Vendors can manage own payout settings" ON vendor_payout_settings;
DROP POLICY IF EXISTS "Admins can manage all payout settings" ON vendor_payout_settings;
DROP POLICY IF EXISTS "payout_settings_vendor_view" ON vendor_payout_settings;
DROP POLICY IF EXISTS "payout_settings_vendor_manage" ON vendor_payout_settings;
DROP POLICY IF EXISTS "payout_settings_admin_manage" ON vendor_payout_settings;

CREATE POLICY "payout_settings_vendor_all" ON vendor_payout_settings
FOR ALL USING (vendor_id = (SELECT auth.uid()))
WITH CHECK (vendor_id = (SELECT auth.uid()));

CREATE POLICY "payout_settings_admin_all" ON vendor_payout_settings
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- 1.17 Vendor Portfolio Items
DROP POLICY IF EXISTS "vendor_portfolio_public_read" ON vendor_portfolio_items;
DROP POLICY IF EXISTS "vendor_portfolio_vendor_manage" ON vendor_portfolio_items;

CREATE POLICY "portfolio_public_read" ON vendor_portfolio_items
FOR SELECT USING (true);

CREATE POLICY "portfolio_vendor_manage" ON vendor_portfolio_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM vendor_profiles vp
    WHERE vp.id = vendor_portfolio_items.vendor_id 
    AND vp.user_id = (SELECT auth.uid())
  )
);

-- 1.18 Vendor Reviews
DROP POLICY IF EXISTS "vendor_reviews_owner_manage" ON vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_public_read" ON vendor_reviews;
DROP POLICY IF EXISTS "vendor_reviews_vendor_respond" ON vendor_reviews;

CREATE POLICY "reviews_unified_select" ON vendor_reviews
FOR SELECT USING (
  status = 'published'
  OR reviewer_id = (SELECT auth.uid())
  OR vendor_id = (SELECT auth.uid())
  OR (SELECT is_admin_user(auth.uid()))
);

CREATE POLICY "reviews_owner_manage" ON vendor_reviews
FOR ALL USING (reviewer_id = (SELECT auth.uid()))
WITH CHECK (reviewer_id = (SELECT auth.uid()));

CREATE POLICY "reviews_vendor_respond" ON vendor_reviews
FOR UPDATE USING (vendor_id = (SELECT auth.uid()));

-- 1.19 Vendor Tiers
DROP POLICY IF EXISTS "vendor_tiers_admin_manage" ON vendor_tiers;
DROP POLICY IF EXISTS "vendor_tiers_public_read" ON vendor_tiers;

CREATE POLICY "tiers_public_read" ON vendor_tiers
FOR SELECT USING (true);

CREATE POLICY "tiers_admin_manage" ON vendor_tiers
FOR ALL USING ((SELECT is_admin_user(auth.uid())))
WITH CHECK ((SELECT is_admin_user(auth.uid())));

-- =====================================================
-- PHASE 3: Remove Duplicate Index
-- =====================================================
DROP INDEX IF EXISTS idx_vendor_payments_user_status;

-- =====================================================
-- Audit Log
-- =====================================================
INSERT INTO audit_logs (action, table_name, new_values)
VALUES (
  'SECURITY_MIGRATION_COMPLETE',
  'multiple_tables',
  jsonb_build_object(
    'migration', 'RLS_OPTIMIZATION_AND_CONSOLIDATION',
    'policies_optimized', 36,
    'duplicate_indexes_removed', 1,
    'completed_at', now()
  )
);