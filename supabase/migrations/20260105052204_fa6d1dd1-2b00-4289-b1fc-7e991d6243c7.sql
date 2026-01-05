-- =====================================================
-- PHASE 1: Fix auth_rls_initplan Performance Issues
-- Replace auth.uid() with (SELECT auth.uid()) in all policies
-- =====================================================

-- ===================
-- Table: bid_comments
-- ===================
DROP POLICY IF EXISTS bid_comments_delete_own ON bid_comments;
CREATE POLICY bid_comments_delete_own ON bid_comments
FOR DELETE TO authenticated
USING ((user_id = (SELECT auth.uid())) OR is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS bid_comments_insert_own ON bid_comments;
CREATE POLICY bid_comments_insert_own ON bid_comments
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS bid_comments_select_participant ON bid_comments;
CREATE POLICY bid_comments_select_participant ON bid_comments
FOR SELECT TO authenticated
USING (
  (user_id = (SELECT auth.uid())) 
  OR is_admin_user((SELECT auth.uid())) 
  OR (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  ))
);

DROP POLICY IF EXISTS bid_comments_update_own ON bid_comments;
CREATE POLICY bid_comments_update_own ON bid_comments
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ===================
-- Table: bid_lines
-- ===================
DROP POLICY IF EXISTS bid_lines_delete_own ON bid_lines;
CREATE POLICY bid_lines_delete_own ON bid_lines
FOR DELETE TO authenticated
USING ((vendor_id = (SELECT auth.uid())) OR is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS bid_lines_insert_vendor ON bid_lines;
CREATE POLICY bid_lines_insert_vendor ON bid_lines
FOR INSERT TO authenticated
WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS bid_lines_staff_access ON bid_lines;
DROP POLICY IF EXISTS bid_lines_vendor_own_only ON bid_lines;
CREATE POLICY bid_lines_unified_select ON bid_lines
FOR SELECT TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS bid_lines_update_own ON bid_lines;
CREATE POLICY bid_lines_update_own ON bid_lines
FOR UPDATE TO authenticated
USING (vendor_id = (SELECT auth.uid()));

-- ===================
-- Table: bid_scores
-- ===================
DROP POLICY IF EXISTS bid_scores_manage_staff ON bid_scores;
DROP POLICY IF EXISTS bid_scores_select_staff ON bid_scores;
CREATE POLICY bid_scores_unified_access ON bid_scores
FOR ALL TO authenticated
USING (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: bookings
-- ===================
DROP POLICY IF EXISTS bookings_select_own ON bookings;
CREATE POLICY bookings_select_own ON bookings
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
);

-- ===================
-- Table: compliance_docs
-- ===================
DROP POLICY IF EXISTS compliance_docs_delete_admin ON compliance_docs;
CREATE POLICY compliance_docs_delete_admin ON compliance_docs
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS compliance_docs_insert_vendor ON compliance_docs;
CREATE POLICY compliance_docs_insert_vendor ON compliance_docs
FOR INSERT TO authenticated
WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS compliance_docs_select_staff ON compliance_docs;
DROP POLICY IF EXISTS compliance_docs_select_vendor ON compliance_docs;
CREATE POLICY compliance_docs_unified_select ON compliance_docs
FOR SELECT TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS compliance_docs_update_staff ON compliance_docs;
CREATE POLICY compliance_docs_update_staff ON compliance_docs
FOR UPDATE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: contracts
-- ===================
DROP POLICY IF EXISTS contracts_delete_admin ON contracts;
CREATE POLICY contracts_delete_admin ON contracts
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS contracts_insert_staff ON contracts;
CREATE POLICY contracts_insert_staff ON contracts
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS contracts_select_creator ON contracts;
DROP POLICY IF EXISTS contracts_select_staff ON contracts;
DROP POLICY IF EXISTS contracts_select_vendor ON contracts;
CREATE POLICY contracts_unified_select ON contracts
FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR (
    tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) 
      AND user_roles.role = 'property_manager'
    )
  )
);

DROP POLICY IF EXISTS contracts_update_staff ON contracts;
CREATE POLICY contracts_update_staff ON contracts
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: financial_reports
-- ===================
DROP POLICY IF EXISTS financial_reports_insert_staff ON financial_reports;
CREATE POLICY financial_reports_insert_staff ON financial_reports
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS financial_reports_select_staff ON financial_reports;
CREATE POLICY financial_reports_select_staff ON financial_reports
FOR SELECT TO authenticated
USING (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS financial_reports_update_staff ON financial_reports;
CREATE POLICY financial_reports_update_staff ON financial_reports
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: invoices
-- ===================
DROP POLICY IF EXISTS invoices_delete_admin ON invoices;
CREATE POLICY invoices_delete_admin ON invoices
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS invoices_insert_authorized ON invoices;
CREATE POLICY invoices_insert_authorized ON invoices
FOR INSERT TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid()) 
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS invoices_select_creator ON invoices;
DROP POLICY IF EXISTS invoices_select_staff ON invoices;
DROP POLICY IF EXISTS invoices_vendor_contracted ON invoices;
CREATE POLICY invoices_unified_select ON invoices
FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS invoices_update_staff ON invoices;
CREATE POLICY invoices_update_staff ON invoices
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid())) 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: maintenance_requests
-- ===================
DROP POLICY IF EXISTS maintenance_requests_delete_admin ON maintenance_requests;
CREATE POLICY maintenance_requests_delete_admin ON maintenance_requests
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS maintenance_requests_insert_tenant ON maintenance_requests;
CREATE POLICY maintenance_requests_insert_tenant ON maintenance_requests
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS "Vendors view assigned requests only" ON maintenance_requests;
DROP POLICY IF EXISTS maintenance_requests_select_staff ON maintenance_requests;
DROP POLICY IF EXISTS maintenance_requests_select_tenant ON maintenance_requests;
CREATE POLICY maintenance_requests_unified_select ON maintenance_requests
FOR SELECT TO authenticated
USING (
  tenant_id = (SELECT auth.uid())
  OR assigned_vendor_id::text = (SELECT auth.uid())::text
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS maintenance_requests_update_staff ON maintenance_requests;
DROP POLICY IF EXISTS maintenance_requests_update_vendor ON maintenance_requests;
CREATE POLICY maintenance_requests_unified_update ON maintenance_requests
FOR UPDATE TO authenticated
USING (
  assigned_vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: messages
-- ===================
DROP POLICY IF EXISTS messages_delete_own ON messages;
CREATE POLICY messages_delete_own ON messages
FOR DELETE TO authenticated
USING (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS messages_insert_authenticated ON messages;
CREATE POLICY messages_insert_authenticated ON messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS messages_admin_select ON messages;
DROP POLICY IF EXISTS messages_select_own ON messages;
CREATE POLICY messages_unified_select ON messages
FOR SELECT TO authenticated
USING (
  sender_id = (SELECT auth.uid())
  OR recipient_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS messages_update_recipient ON messages;
CREATE POLICY messages_update_recipient ON messages
FOR UPDATE TO authenticated
USING (recipient_id = (SELECT auth.uid()));

-- ===================
-- Table: milestone_deliverables
-- ===================
DROP POLICY IF EXISTS milestone_deliverables_delete_admin ON milestone_deliverables;
CREATE POLICY milestone_deliverables_delete_admin ON milestone_deliverables
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS milestone_deliverables_insert_own ON milestone_deliverables;
CREATE POLICY milestone_deliverables_insert_own ON milestone_deliverables
FOR INSERT TO authenticated
WITH CHECK (uploaded_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS milestone_deliverables_select_staff ON milestone_deliverables;
DROP POLICY IF EXISTS milestone_deliverables_select_uploader ON milestone_deliverables;
CREATE POLICY milestone_deliverables_unified_select ON milestone_deliverables
FOR SELECT TO authenticated
USING (
  uploaded_by = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS milestone_deliverables_update_staff ON milestone_deliverables;
CREATE POLICY milestone_deliverables_update_staff ON milestone_deliverables
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: news_analytics
-- ===================
DROP POLICY IF EXISTS news_analytics_select_admin ON news_analytics;
CREATE POLICY news_analytics_select_admin ON news_analytics
FOR SELECT TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: news_articles
-- ===================
DROP POLICY IF EXISTS news_articles_manage_admin ON news_articles;
DROP POLICY IF EXISTS news_articles_select_admin ON news_articles;
DROP POLICY IF EXISTS news_articles_select_public ON news_articles;
CREATE POLICY news_articles_unified_select ON news_articles
FOR SELECT TO authenticated
USING (
  is_published = true
  OR is_admin_user((SELECT auth.uid()))
);

CREATE POLICY news_articles_manage_admin ON news_articles
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: newsletter_subscriptions
-- ===================
DROP POLICY IF EXISTS newsletter_subscriptions_select_own ON newsletter_subscriptions;
CREATE POLICY newsletter_subscriptions_select_own ON newsletter_subscriptions
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS newsletter_subscriptions_update_own ON newsletter_subscriptions;
CREATE POLICY newsletter_subscriptions_update_own ON newsletter_subscriptions
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ===================
-- Table: payment_refunds
-- ===================
DROP POLICY IF EXISTS payment_refunds_select_admin ON payment_refunds;
DROP POLICY IF EXISTS payment_refunds_select_own ON payment_refunds;
CREATE POLICY payment_refunds_unified_select ON payment_refunds
FOR SELECT TO authenticated
USING (
  requested_by = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS payment_refunds_update_admin ON payment_refunds;
CREATE POLICY payment_refunds_update_admin ON payment_refunds
FOR UPDATE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: payment_templates
-- ===================
DROP POLICY IF EXISTS payment_templates_manage_admin ON payment_templates;
DROP POLICY IF EXISTS payment_templates_select_staff ON payment_templates;
CREATE POLICY payment_templates_unified_access ON payment_templates
FOR ALL TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: profile_name_audit
-- ===================
DROP POLICY IF EXISTS profile_name_audit_select_admin ON profile_name_audit;
DROP POLICY IF EXISTS profile_name_audit_select_own ON profile_name_audit;
CREATE POLICY profile_name_audit_unified_select ON profile_name_audit
FOR SELECT TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

-- ===================
-- Table: profiles
-- ===================
DROP POLICY IF EXISTS profiles_delete_admin_only ON profiles;
CREATE POLICY profiles_delete_admin_only ON profiles
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS profiles_insert_system ON profiles;
CREATE POLICY profiles_insert_system ON profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_own_or_admin_select ON profiles;
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_staff ON profiles;
DROP POLICY IF EXISTS profiles_select_tenant_staff ON profiles;
CREATE POLICY profiles_unified_select ON profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_unified_update ON profiles
FOR UPDATE TO authenticated
USING (
  id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

-- ===================
-- Table: project_assignments
-- ===================
DROP POLICY IF EXISTS project_assignments_manage_staff ON project_assignments;
DROP POLICY IF EXISTS project_assignments_select_staff ON project_assignments;
DROP POLICY IF EXISTS project_assignments_select_vendor ON project_assignments;
CREATE POLICY project_assignments_unified_access ON project_assignments
FOR ALL TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: project_documents
-- ===================
DROP POLICY IF EXISTS project_documents_delete_admin ON project_documents;
CREATE POLICY project_documents_delete_admin ON project_documents
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS project_documents_insert_staff ON project_documents;
CREATE POLICY project_documents_insert_staff ON project_documents
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = (SELECT auth.uid())
  AND (
    is_admin_user((SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) 
      AND user_roles.role = 'property_manager'
    )
  )
);

DROP POLICY IF EXISTS project_documents_select_staff ON project_documents;
DROP POLICY IF EXISTS project_documents_select_uploader ON project_documents;
CREATE POLICY project_documents_unified_select ON project_documents
FOR SELECT TO authenticated
USING (
  uploaded_by = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: project_milestones
-- ===================
DROP POLICY IF EXISTS project_milestones_manage_staff ON project_milestones;
DROP POLICY IF EXISTS project_milestones_select_staff ON project_milestones;
CREATE POLICY project_milestones_unified_access ON project_milestones
FOR ALL TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_milestones.project_id 
    AND projects.assigned_vendor_id = (SELECT auth.uid())
  )
);

-- ===================
-- Table: projects
-- ===================
DROP POLICY IF EXISTS projects_delete_admin ON projects;
CREATE POLICY projects_delete_admin ON projects
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS projects_insert_staff ON projects;
CREATE POLICY projects_insert_staff ON projects
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS projects_select_assigned_vendor ON projects;
DROP POLICY IF EXISTS projects_select_creator ON projects;
DROP POLICY IF EXISTS projects_select_open ON projects;
DROP POLICY IF EXISTS projects_select_staff ON projects;
CREATE POLICY projects_unified_select ON projects
FOR SELECT TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR assigned_vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
  OR (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) 
      AND user_roles.role = 'vendor'
    )
  )
);

DROP POLICY IF EXISTS projects_update_assigned_vendor ON projects;
DROP POLICY IF EXISTS projects_update_staff ON projects;
CREATE POLICY projects_unified_update ON projects
FOR UPDATE TO authenticated
USING (
  assigned_vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: properties
-- ===================
DROP POLICY IF EXISTS "Staff can manage properties" ON properties;
DROP POLICY IF EXISTS properties_delete_admin ON properties;
DROP POLICY IF EXISTS properties_insert_staff ON properties;
DROP POLICY IF EXISTS properties_authenticated_view ON properties;
DROP POLICY IF EXISTS properties_owner_access ON properties;
DROP POLICY IF EXISTS properties_select_owner ON properties;
DROP POLICY IF EXISTS properties_select_staff ON properties;
DROP POLICY IF EXISTS properties_staff_access ON properties;
DROP POLICY IF EXISTS properties_update_staff ON properties;

CREATE POLICY properties_unified_select ON properties
FOR SELECT TO authenticated
USING (
  status = ANY(ARRAY['available', 'published'])
  OR owner_id = (SELECT auth.uid())::text
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

CREATE POLICY properties_insert_staff ON properties
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

CREATE POLICY properties_update_staff ON properties
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

CREATE POLICY properties_delete_admin ON properties
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: property_inquiries
-- ===================
DROP POLICY IF EXISTS property_inquiries_select_own ON property_inquiries;
DROP POLICY IF EXISTS property_inquiries_select_staff ON property_inquiries;
CREATE POLICY property_inquiries_unified_select ON property_inquiries
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: quick_quote_requests
-- ===================
DROP POLICY IF EXISTS quick_quote_requests_delete_admin ON quick_quote_requests;
CREATE POLICY quick_quote_requests_delete_admin ON quick_quote_requests
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS quick_quote_requests_insert_staff ON quick_quote_requests;
CREATE POLICY quick_quote_requests_insert_staff ON quick_quote_requests
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS quick_quote_requests_select_creator ON quick_quote_requests;
DROP POLICY IF EXISTS quick_quote_requests_select_staff ON quick_quote_requests;
DROP POLICY IF EXISTS quick_quote_requests_select_vendor ON quick_quote_requests;
CREATE POLICY quick_quote_requests_unified_select ON quick_quote_requests
FOR SELECT TO authenticated
USING (
  property_manager_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
  OR (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) 
      AND user_roles.role = 'vendor'
    )
  )
);

DROP POLICY IF EXISTS quick_quote_requests_update_staff ON quick_quote_requests;
CREATE POLICY quick_quote_requests_update_staff ON quick_quote_requests
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: rfq_documents
-- ===================
DROP POLICY IF EXISTS rfq_documents_delete_admin ON rfq_documents;
CREATE POLICY rfq_documents_delete_admin ON rfq_documents
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS rfq_documents_insert_staff ON rfq_documents;
CREATE POLICY rfq_documents_insert_staff ON rfq_documents
FOR INSERT TO authenticated
WITH CHECK (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS rfq_documents_select_invited_vendor ON rfq_documents;
DROP POLICY IF EXISTS rfq_documents_select_staff ON rfq_documents;
CREATE POLICY rfq_documents_unified_select ON rfq_documents
FOR SELECT TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
  OR EXISTS (
    SELECT 1 FROM rfq_invites
    WHERE rfq_invites.rfq_id = rfq_documents.rfq_id 
    AND rfq_invites.vendor_id = (SELECT auth.uid())
  )
);

-- ===================
-- Table: rfq_invites
-- ===================
DROP POLICY IF EXISTS rfq_invites_staff_manage ON rfq_invites;
DROP POLICY IF EXISTS rfq_invites_vendor_read ON rfq_invites;
CREATE POLICY rfq_invites_unified_access ON rfq_invites
FOR ALL TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
);

-- ===================
-- Table: rfq_lots
-- ===================
DROP POLICY IF EXISTS rfq_lots_staff_manage ON rfq_lots;
DROP POLICY IF EXISTS rfq_lots_vendor_view ON rfq_lots;
CREATE POLICY rfq_lots_unified_access ON rfq_lots
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
  OR EXISTS (
    SELECT 1 FROM rfq_invites inv
    WHERE inv.rfq_id = rfq_lots.rfq_id 
    AND inv.vendor_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
);

-- ===================
-- Table: rfq_templates
-- ===================
DROP POLICY IF EXISTS rfq_templates_manage_admin ON rfq_templates;
DROP POLICY IF EXISTS rfq_templates_select_staff ON rfq_templates;
CREATE POLICY rfq_templates_unified_access ON rfq_templates
FOR ALL TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: rfqs
-- ===================
DROP POLICY IF EXISTS rfqs_staff_manage ON rfqs;
DROP POLICY IF EXISTS rfqs_vendor_view ON rfqs;
CREATE POLICY rfqs_unified_access ON rfqs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
  OR EXISTS (
    SELECT 1 FROM rfq_invites inv
    WHERE inv.rfq_id = rfqs.id 
    AND inv.vendor_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = ANY(ARRAY['admin', 'property_manager'])
  )
);

-- ===================
-- Table: rss_feed_sources
-- ===================
DROP POLICY IF EXISTS rss_feed_sources_manage_admin ON rss_feed_sources;
CREATE POLICY rss_feed_sources_manage_admin ON rss_feed_sources
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: security_events
-- ===================
DROP POLICY IF EXISTS "Only admins can read security events" ON security_events;
CREATE POLICY security_events_select_admin ON security_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'admin'
  )
);

-- ===================
-- Table: sent_emails
-- ===================
DROP POLICY IF EXISTS "Admins can manage all sent emails" ON sent_emails;
DROP POLICY IF EXISTS "Admins can delete sent emails" ON sent_emails;
DROP POLICY IF EXISTS "Admins can insert sent emails" ON sent_emails;
DROP POLICY IF EXISTS "Allow insert sent emails" ON sent_emails;
DROP POLICY IF EXISTS "Admins can view all sent emails" ON sent_emails;

CREATE POLICY sent_emails_admin_access ON sent_emails
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- Keep public insert for system
CREATE POLICY sent_emails_system_insert ON sent_emails
FOR INSERT TO public
WITH CHECK (true);

-- ===================
-- Table: subscribers
-- ===================
DROP POLICY IF EXISTS subscribers_manage_admin ON subscribers;
DROP POLICY IF EXISTS subscribers_select_admin ON subscribers;
DROP POLICY IF EXISTS subscribers_insert_public ON subscribers;

CREATE POLICY subscribers_admin_access ON subscribers
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: subscription_requests
-- ===================
DROP POLICY IF EXISTS "Vendors can create subscription requests" ON subscription_requests;
CREATE POLICY subscription_requests_insert_vendor ON subscription_requests
FOR INSERT TO authenticated
WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all subscription requests" ON subscription_requests;
DROP POLICY IF EXISTS "Vendors can view own subscription requests" ON subscription_requests;
CREATE POLICY subscription_requests_unified_select ON subscription_requests
FOR SELECT TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Admins can update subscription requests" ON subscription_requests;
CREATE POLICY subscription_requests_update_admin ON subscription_requests
FOR UPDATE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: system_health
-- ===================
DROP POLICY IF EXISTS system_health_manage_admin ON system_health;
DROP POLICY IF EXISTS system_health_select_admin ON system_health;
CREATE POLICY system_health_admin_access ON system_health
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: system_settings
-- ===================
DROP POLICY IF EXISTS system_settings_manage_admin ON system_settings;
DROP POLICY IF EXISTS system_settings_select_admin ON system_settings;
CREATE POLICY system_settings_admin_access ON system_settings
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: team_members
-- ===================
DROP POLICY IF EXISTS team_members_manage_admin ON team_members;
CREATE POLICY team_members_manage_admin ON team_members
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: tenants
-- ===================
DROP POLICY IF EXISTS tenants_admin_read ON tenants;
CREATE POLICY tenants_admin_read ON tenants
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid()) 
    AND ur.role = 'admin'
  )
);

-- ===================
-- Table: transactions
-- ===================
DROP POLICY IF EXISTS transactions_manage_admin ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS transactions_select_admin ON transactions;
DROP POLICY IF EXISTS transactions_select_own ON transactions;
CREATE POLICY transactions_unified_select ON transactions
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

CREATE POLICY transactions_manage_admin ON transactions
FOR ALL TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: user_approval_requests
-- ===================
DROP POLICY IF EXISTS approval_requests_insert_system ON user_approval_requests;
CREATE POLICY approval_requests_insert_system ON user_approval_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS approval_requests_admin_select ON user_approval_requests;
DROP POLICY IF EXISTS approval_requests_select_own ON user_approval_requests;
CREATE POLICY approval_requests_unified_select ON user_approval_requests
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS approval_requests_admin_update ON user_approval_requests;
CREATE POLICY approval_requests_admin_update ON user_approval_requests
FOR UPDATE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: user_notification_settings
-- ===================
DROP POLICY IF EXISTS user_notification_settings_manage_own ON user_notification_settings;
DROP POLICY IF EXISTS user_notification_settings_select_own ON user_notification_settings;

CREATE POLICY user_notification_settings_own_access ON user_notification_settings
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ===================
-- Table: user_preferences
-- ===================
DROP POLICY IF EXISTS user_preferences_own_only ON user_preferences;
CREATE POLICY user_preferences_own_only ON user_preferences
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ===================
-- Table: user_roles
-- ===================
DROP POLICY IF EXISTS user_roles_delete_admin ON user_roles;
CREATE POLICY user_roles_delete_admin ON user_roles
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS user_roles_insert_admin ON user_roles;
CREATE POLICY user_roles_insert_admin ON user_roles
FOR INSERT TO authenticated
WITH CHECK (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS user_roles_select_admin ON user_roles;
DROP POLICY IF EXISTS user_roles_select_own ON user_roles;
CREATE POLICY user_roles_unified_select ON user_roles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS user_roles_update_admin ON user_roles;
CREATE POLICY user_roles_update_admin ON user_roles
FOR UPDATE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- ===================
-- Table: vendor_applications
-- ===================
DROP POLICY IF EXISTS vendor_applications_delete_admin ON vendor_applications;
CREATE POLICY vendor_applications_delete_admin ON vendor_applications
FOR DELETE TO authenticated
USING (is_admin_user((SELECT auth.uid())));

DROP POLICY IF EXISTS vendor_applications_insert_own ON vendor_applications;
CREATE POLICY vendor_applications_insert_own ON vendor_applications
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS vendor_applications_select_own ON vendor_applications;
DROP POLICY IF EXISTS vendor_applications_select_staff ON vendor_applications;
CREATE POLICY vendor_applications_unified_select ON vendor_applications
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS vendor_applications_update_staff ON vendor_applications;
CREATE POLICY vendor_applications_update_staff ON vendor_applications
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: vendor_bids
-- ===================
DROP POLICY IF EXISTS vendor_bids_delete_own ON vendor_bids;
CREATE POLICY vendor_bids_delete_own ON vendor_bids
FOR DELETE TO authenticated
USING (
  vendor_id = (SELECT auth.uid()) 
  AND status = 'pending'
);

DROP POLICY IF EXISTS vendor_bids_insert_vendor ON vendor_bids;
CREATE POLICY vendor_bids_insert_vendor ON vendor_bids
FOR INSERT TO authenticated
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) 
      AND user_roles.role = 'vendor'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'vendor'
    )
  )
);

DROP POLICY IF EXISTS vendor_bids_select_own ON vendor_bids;
DROP POLICY IF EXISTS vendor_bids_select_staff ON vendor_bids;
CREATE POLICY vendor_bids_unified_select ON vendor_bids
FOR SELECT TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS vendor_bids_update_own ON vendor_bids;
DROP POLICY IF EXISTS vendor_bids_update_staff ON vendor_bids;
CREATE POLICY vendor_bids_unified_update ON vendor_bids
FOR UPDATE TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- ===================
-- Table: vendor_contacts
-- ===================
DROP POLICY IF EXISTS vendor_contacts_own_access ON vendor_contacts;
CREATE POLICY vendor_contacts_own_access ON vendor_contacts
FOR ALL TO authenticated
USING (vendor_id = (SELECT auth.uid()))
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- ===================
-- Table: vendor_document_comments
-- ===================
DROP POLICY IF EXISTS vendor_document_comments_delete_own ON vendor_document_comments;
CREATE POLICY vendor_document_comments_delete_own ON vendor_document_comments
FOR DELETE TO authenticated
USING (
  user_id = (SELECT auth.uid()) 
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS vendor_document_comments_insert_own ON vendor_document_comments;
CREATE POLICY vendor_document_comments_insert_own ON vendor_document_comments
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS vendor_document_comments_select_participant ON vendor_document_comments;
CREATE POLICY vendor_document_comments_select_participant ON vendor_document_comments
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid()) 
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS vendor_document_comments_update_own ON vendor_document_comments;
CREATE POLICY vendor_document_comments_update_own ON vendor_document_comments
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ===================
-- Table: vendor_documents
-- ===================
DROP POLICY IF EXISTS vendor_documents_delete_own ON vendor_documents;
CREATE POLICY vendor_documents_delete_own ON vendor_documents
FOR DELETE TO authenticated
USING (
  vendor_id = (SELECT auth.uid()) 
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS vendor_documents_insert_own ON vendor_documents;
CREATE POLICY vendor_documents_insert_own ON vendor_documents
FOR INSERT TO authenticated
WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS vendor_documents_select_own ON vendor_documents;
DROP POLICY IF EXISTS vendor_documents_select_staff ON vendor_documents;
CREATE POLICY vendor_documents_unified_select ON vendor_documents
FOR SELECT TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

DROP POLICY IF EXISTS vendor_documents_update_own ON vendor_documents;
DROP POLICY IF EXISTS vendor_documents_update_staff ON vendor_documents;
CREATE POLICY vendor_documents_unified_update ON vendor_documents
FOR UPDATE TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

-- ===================
-- Table: vendor_inquiries
-- ===================
DROP POLICY IF EXISTS "Vendors can create own inquiries" ON vendor_inquiries;
CREATE POLICY vendor_inquiries_insert_own ON vendor_inquiries
FOR INSERT TO authenticated
WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all inquiries" ON vendor_inquiries;
DROP POLICY IF EXISTS "Vendors can view own inquiries" ON vendor_inquiries;
CREATE POLICY vendor_inquiries_unified_select ON vendor_inquiries
FOR SELECT TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Admins can update all inquiries" ON vendor_inquiries;
DROP POLICY IF EXISTS "Vendors can update own open inquiries" ON vendor_inquiries;
CREATE POLICY vendor_inquiries_unified_update ON vendor_inquiries
FOR UPDATE TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR (vendor_id = (SELECT auth.uid()) AND status = 'open')
);

-- ===================
-- Table: vendor_invitations
-- ===================
DROP POLICY IF EXISTS vendor_invitations_manage_staff ON vendor_invitations;
DROP POLICY IF EXISTS vendor_invitations_own_view ON vendor_invitations;
DROP POLICY IF EXISTS vendor_invitations_select_staff ON vendor_invitations;
CREATE POLICY vendor_invitations_unified_access ON vendor_invitations
FOR ALL TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
  OR email = (SELECT profiles.email FROM profiles WHERE profiles.id = (SELECT auth.uid()))
);

-- ===================
-- Table: vendor_lead_credits
-- ===================
DROP POLICY IF EXISTS vendor_lead_credits_manage_admin ON vendor_lead_credits;
DROP POLICY IF EXISTS vendor_lead_credits_owner_access ON vendor_lead_credits;
DROP POLICY IF EXISTS vendor_lead_credits_select_admin ON vendor_lead_credits;
DROP POLICY IF EXISTS vendor_lead_credits_select_own ON vendor_lead_credits;
CREATE POLICY vendor_lead_credits_unified_access ON vendor_lead_credits
FOR ALL TO authenticated
USING (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
)
WITH CHECK (
  vendor_id = (SELECT auth.uid())
  OR is_admin_user((SELECT auth.uid()))
);

-- ===================
-- Table: vendor_lead_matches
-- ===================
DROP POLICY IF EXISTS vendor_lead_matches_manage_staff ON vendor_lead_matches;
DROP POLICY IF EXISTS vendor_lead_matches_select_staff ON vendor_lead_matches;
CREATE POLICY vendor_lead_matches_staff_access ON vendor_lead_matches
FOR ALL TO authenticated
USING (
  is_admin_user((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) 
    AND user_roles.role = 'property_manager'
  )
);

-- =====================================================
-- PHASE 3: Harden Audit Logs Security
-- Remove user isolation, admin-only access
-- =====================================================

DROP POLICY IF EXISTS audit_logs_user_isolation ON audit_logs;
CREATE POLICY audit_logs_admin_only ON audit_logs
FOR SELECT TO authenticated
USING (is_admin_user((SELECT auth.uid())));

-- =====================================================
-- Add documentation comments
-- =====================================================

COMMENT ON POLICY properties_unified_select ON properties IS 
'Unified SELECT policy with performance optimization (SELECT auth.uid()). 
Consolidates 6 previous policies. Allows: public properties, owner access, staff access.';

COMMENT ON POLICY profiles_unified_select ON profiles IS 
'Unified SELECT policy with performance optimization (SELECT auth.uid()). 
Consolidates 4 previous policies. Allows: own profile, admin access, staff access.';

COMMENT ON POLICY audit_logs_admin_only ON audit_logs IS 
'SECURITY HARDENING: Restricts audit log access to administrators only.
Prevents users from viewing their own logs to avoid security reconnaissance.';

-- =====================================================
-- Final cleanup: Remove any remaining public role policies 
-- that should be authenticated
-- =====================================================

-- These are intentionally public for anonymous access, no changes needed:
-- - anon_view_published_properties
-- - notification_settings_own_insert/view/update (public with auth check)
-- - payment_refunds_secure_insert (public with auth check)
-- - property_inquiries_secure_insert (public with auth check)
-- - subscribers_controlled_insert/consolidated_* (public with auth check)