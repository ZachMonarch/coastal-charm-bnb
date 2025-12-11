-- ============================================
-- PHASE 2: Remaining Tables RLS Policies (Fixed Column Names)
-- ============================================

-- ============================================
-- 11. BID_COMMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "bid_comments_select_participant" ON public.bid_comments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "bid_comments_insert_own" ON public.bid_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bid_comments_update_own" ON public.bid_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "bid_comments_delete_own" ON public.bid_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin_user(auth.uid()));

-- ============================================
-- 12. BID_SCORES TABLE POLICIES
-- ============================================

CREATE POLICY "bid_scores_select_staff" ON public.bid_scores
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "bid_scores_manage_staff" ON public.bid_scores
  FOR ALL TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- ============================================
-- 13. COMPLIANCE_DOCS TABLE POLICIES
-- ============================================

CREATE POLICY "compliance_docs_select_vendor" ON public.compliance_docs
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "compliance_docs_select_staff" ON public.compliance_docs
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "compliance_docs_insert_vendor" ON public.compliance_docs
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "compliance_docs_update_staff" ON public.compliance_docs
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "compliance_docs_delete_admin" ON public.compliance_docs
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 14. MILESTONE_DELIVERABLES TABLE POLICIES
-- ============================================

CREATE POLICY "milestone_deliverables_select_uploader" ON public.milestone_deliverables
  FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "milestone_deliverables_select_staff" ON public.milestone_deliverables
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "milestone_deliverables_insert_own" ON public.milestone_deliverables
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "milestone_deliverables_update_staff" ON public.milestone_deliverables
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "milestone_deliverables_delete_admin" ON public.milestone_deliverables
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 15. NEWS_ARTICLES TABLE POLICIES (Public read)
-- ============================================

CREATE POLICY "news_articles_select_public" ON public.news_articles
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "news_articles_select_admin" ON public.news_articles
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "news_articles_manage_admin" ON public.news_articles
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 16. PAYMENT_TEMPLATES TABLE POLICIES
-- ============================================

CREATE POLICY "payment_templates_select_staff" ON public.payment_templates
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "payment_templates_manage_admin" ON public.payment_templates
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 17. PROFILE_NAME_AUDIT TABLE POLICIES
-- ============================================

CREATE POLICY "profile_name_audit_select_own" ON public.profile_name_audit
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "profile_name_audit_select_admin" ON public.profile_name_audit
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 18. PROJECT_ASSIGNMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "project_assignments_select_vendor" ON public.project_assignments
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "project_assignments_select_staff" ON public.project_assignments
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "project_assignments_manage_staff" ON public.project_assignments
  FOR ALL TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- ============================================
-- 19. PROJECT_DOCUMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "project_documents_select_uploader" ON public.project_documents
  FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "project_documents_select_staff" ON public.project_documents
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "project_documents_insert_staff" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      is_admin_user(auth.uid()) OR
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
    )
  );

CREATE POLICY "project_documents_delete_admin" ON public.project_documents
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 20. PROJECT_MILESTONES TABLE POLICIES
-- ============================================

CREATE POLICY "project_milestones_select_staff" ON public.project_milestones
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager') OR
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_milestones.project_id AND projects.assigned_vendor_id = auth.uid())
  );

CREATE POLICY "project_milestones_manage_staff" ON public.project_milestones
  FOR ALL TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- ============================================
-- 21. QUICK_QUOTE_REQUESTS TABLE POLICIES
-- ============================================

CREATE POLICY "quick_quote_requests_select_creator" ON public.quick_quote_requests
  FOR SELECT TO authenticated
  USING (property_manager_id = auth.uid());

CREATE POLICY "quick_quote_requests_select_staff" ON public.quick_quote_requests
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "quick_quote_requests_select_vendor" ON public.quick_quote_requests
  FOR SELECT TO authenticated
  USING (
    status = 'open' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  );

CREATE POLICY "quick_quote_requests_insert_staff" ON public.quick_quote_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "quick_quote_requests_update_staff" ON public.quick_quote_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "quick_quote_requests_delete_admin" ON public.quick_quote_requests
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 22. RFQ_TEMPLATES TABLE POLICIES
-- ============================================

CREATE POLICY "rfq_templates_select_staff" ON public.rfq_templates
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "rfq_templates_manage_admin" ON public.rfq_templates
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 23. RSS_FEED_SOURCES TABLE POLICIES
-- ============================================

CREATE POLICY "rss_feed_sources_select_all" ON public.rss_feed_sources
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "rss_feed_sources_manage_admin" ON public.rss_feed_sources
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 24. VENDOR_APPLICATIONS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_applications_select_own" ON public.vendor_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vendor_applications_select_staff" ON public.vendor_applications
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "vendor_applications_insert_own" ON public.vendor_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vendor_applications_update_staff" ON public.vendor_applications
  FOR UPDATE TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "vendor_applications_delete_admin" ON public.vendor_applications
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 25. VENDOR_DOCUMENT_COMMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_document_comments_select_participant" ON public.vendor_document_comments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin_user(auth.uid())
  );

CREATE POLICY "vendor_document_comments_insert_own" ON public.vendor_document_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vendor_document_comments_update_own" ON public.vendor_document_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vendor_document_comments_delete_own" ON public.vendor_document_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin_user(auth.uid()));

-- ============================================
-- 26. VENDOR_DOCUMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_documents_select_own" ON public.vendor_documents
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_documents_select_staff" ON public.vendor_documents
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "vendor_documents_insert_own" ON public.vendor_documents
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "vendor_documents_update_own" ON public.vendor_documents
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_documents_update_staff" ON public.vendor_documents
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_documents_delete_own" ON public.vendor_documents
  FOR DELETE TO authenticated
  USING (vendor_id = auth.uid() OR is_admin_user(auth.uid()));

-- ============================================
-- 27. VENDOR_INVITATIONS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_invitations_select_staff" ON public.vendor_invitations
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "vendor_invitations_manage_staff" ON public.vendor_invitations
  FOR ALL TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- ============================================
-- 28. VENDOR_LEAD_MATCHES TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_lead_matches_select_vendor" ON public.vendor_lead_matches
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_lead_matches_select_staff" ON public.vendor_lead_matches
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "vendor_lead_matches_manage_staff" ON public.vendor_lead_matches
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 29. VENDOR_PAYOUT_SETTINGS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_payout_settings_select_own" ON public.vendor_payout_settings
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_payout_settings_select_admin" ON public.vendor_payout_settings
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_payout_settings_insert_own" ON public.vendor_payout_settings
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "vendor_payout_settings_update_own" ON public.vendor_payout_settings
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_payout_settings_delete_admin" ON public.vendor_payout_settings
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 30. VENDOR_PAYOUTS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_payouts_select_own" ON public.vendor_payouts
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_payouts_select_admin" ON public.vendor_payouts
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_payouts_manage_admin" ON public.vendor_payouts
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 31. VENDOR_PORTFOLIO_ITEMS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_portfolio_items_select_own" ON public.vendor_portfolio_items
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_portfolio_items_select_public" ON public.vendor_portfolio_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles 
      WHERE vendor_profiles.user_id = vendor_portfolio_items.vendor_id 
      AND vendor_profiles.is_verified = true
    )
  );

CREATE POLICY "vendor_portfolio_items_insert_own" ON public.vendor_portfolio_items
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "vendor_portfolio_items_update_own" ON public.vendor_portfolio_items
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_portfolio_items_delete_own" ON public.vendor_portfolio_items
  FOR DELETE TO authenticated
  USING (vendor_id = auth.uid() OR is_admin_user(auth.uid()));

-- ============================================
-- 32. VENDOR_REVIEWS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_reviews_select_vendor" ON public.vendor_reviews
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_reviews_select_published" ON public.vendor_reviews
  FOR SELECT TO authenticated
  USING (status = 'published');

CREATE POLICY "vendor_reviews_select_admin" ON public.vendor_reviews
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_reviews_insert_reviewer" ON public.vendor_reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "vendor_reviews_update_admin" ON public.vendor_reviews
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_reviews_delete_admin" ON public.vendor_reviews
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 33. VENDOR_TIERS TABLE POLICIES
-- ============================================

CREATE POLICY "vendor_tiers_select_own" ON public.vendor_tiers
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_tiers_select_staff" ON public.vendor_tiers
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "vendor_tiers_manage_system" ON public.vendor_tiers
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 34. SYSTEM_HEALTH TABLE POLICIES
-- ============================================

CREATE POLICY "system_health_select_admin" ON public.system_health
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "system_health_manage_admin" ON public.system_health
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 35. SYSTEM_SETTINGS TABLE POLICIES
-- ============================================

CREATE POLICY "system_settings_select_admin" ON public.system_settings
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "system_settings_manage_admin" ON public.system_settings
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 36. TEAM_MEMBERS TABLE POLICIES
-- ============================================

CREATE POLICY "team_members_select_authenticated" ON public.team_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "team_members_manage_admin" ON public.team_members
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- ============================================
-- 37. WORK_ORDERS TABLE POLICIES (uses assigned_to, not vendor_id)
-- ============================================

CREATE POLICY "work_orders_select_assigned" ON public.work_orders
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "work_orders_select_creator" ON public.work_orders
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "work_orders_select_staff" ON public.work_orders
  FOR SELECT TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

CREATE POLICY "work_orders_manage_staff" ON public.work_orders
  FOR ALL TO authenticated
  USING (
    is_admin_user(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager')
  );

-- ============================================
-- 38. Additional Tables
-- ============================================

-- VENDOR_LEAD_CREDITS
CREATE POLICY "vendor_lead_credits_select_own" ON public.vendor_lead_credits
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_lead_credits_select_admin" ON public.vendor_lead_credits
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_lead_credits_manage_admin" ON public.vendor_lead_credits
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- VENDOR_NOTIFICATION_SETTINGS (uses user_id, not vendor_id)
CREATE POLICY "vendor_notification_settings_select_own" ON public.vendor_notification_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vendor_notification_settings_manage_own" ON public.vendor_notification_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- VENDOR_PAYMENT_METHODS
CREATE POLICY "vendor_payment_methods_select_own" ON public.vendor_payment_methods
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "vendor_payment_methods_select_admin" ON public.vendor_payment_methods
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_payment_methods_manage_own" ON public.vendor_payment_methods
  FOR ALL TO authenticated
  USING (vendor_id = auth.uid());

-- SUBSCRIBERS
CREATE POLICY "subscribers_select_admin" ON public.subscribers
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "subscribers_insert_public" ON public.subscribers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "subscribers_manage_admin" ON public.subscribers
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- TRANSACTIONS
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "transactions_select_admin" ON public.transactions
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "transactions_manage_admin" ON public.transactions
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- USER_NOTIFICATION_SETTINGS
CREATE POLICY "user_notification_settings_select_own" ON public.user_notification_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_notification_settings_manage_own" ON public.user_notification_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid());