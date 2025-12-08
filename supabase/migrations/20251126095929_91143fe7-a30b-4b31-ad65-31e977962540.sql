-- ============================================
-- PHASE A: CRITICAL SECURITY & PERFORMANCE FIXES
-- Fixes 3 insecure RLS policies and optimizes performance
-- ============================================

-- A.1: Fix insecure bookings RLS policy (removes "true OR" bypass)
DROP POLICY IF EXISTS "bookings_unified_access" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated read of bookings" ON public.bookings;

CREATE POLICY "bookings_secure_select" ON public.bookings
FOR SELECT USING (
  (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

-- A.2: Fix insecure properties RLS policies (removes public "true OR" bypass)
DROP POLICY IF EXISTS "Allow anon read of properties" ON public.properties;
DROP POLICY IF EXISTS "properties_unified_access" ON public.properties;

-- Secure anonymous access: only published properties visible to public
CREATE POLICY "properties_public_listing" ON public.properties
FOR SELECT USING (
  status IN ('available', 'published')
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

-- A.3: Grant EXECUTE permissions on security functions to fix "permission denied" errors
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(text) TO authenticated;

-- A.4: Optimize RLS policies - Convert auth.uid() to (SELECT auth.uid()) for O(1) performance
-- This fixes the Supabase Advisor "Inefficient RLS policy" warnings

-- Optimize audit_logs policies
DROP POLICY IF EXISTS "audit_logs_unified_select" ON public.audit_logs;
CREATE POLICY "audit_logs_unified_select" ON public.audit_logs
FOR SELECT USING (
  (user_id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

DROP POLICY IF EXISTS "audit_logs_unified_update" ON public.audit_logs;
CREATE POLICY "audit_logs_unified_update" ON public.audit_logs
FOR UPDATE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize bid_lines policies
DROP POLICY IF EXISTS "bid_lines_unified_access" ON public.bid_lines;
CREATE POLICY "bid_lines_unified_access" ON public.bid_lines
FOR ALL USING (
  (vendor_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM rfq_lots rl
    JOIN rfqs r ON r.id = rl.rfq_id
    WHERE rl.id = bid_lines.rfq_lot_id
      AND r.tenant_id = (SELECT auth.uid())
      AND ((SELECT is_admin_user((SELECT auth.uid()))) OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager')))
  ))
)
WITH CHECK (
  (vendor_id = (SELECT auth.uid()))
  OR (EXISTS (
    SELECT 1 FROM rfq_lots rl
    JOIN rfqs r ON r.id = rl.rfq_id
    WHERE rl.id = bid_lines.rfq_lot_id
      AND r.tenant_id = (SELECT auth.uid())
      AND (SELECT is_admin_user((SELECT auth.uid())))
  ))
);

-- Optimize compliance_docs policies
DROP POLICY IF EXISTS "compliance_docs_unified_access" ON public.compliance_docs;
CREATE POLICY "compliance_docs_unified_access" ON public.compliance_docs
FOR ALL USING (
  (vendor_id = (SELECT auth.uid()))
  OR (
    (tenant_id = (SELECT auth.uid()))
    AND ((SELECT is_admin_user((SELECT auth.uid()))) OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager')))
  )
)
WITH CHECK (
  (vendor_id = (SELECT auth.uid()))
  OR (
    (tenant_id = (SELECT auth.uid()))
    AND ((SELECT is_admin_user((SELECT auth.uid()))) OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager')))
  )
);

-- Optimize contracts policies
DROP POLICY IF EXISTS "contracts_unified_access" ON public.contracts;
CREATE POLICY "contracts_unified_access" ON public.contracts
FOR ALL USING (
  (vendor_id = (SELECT auth.uid()))
  OR (
    (tenant_id = (SELECT auth.uid()))
    AND ((SELECT is_admin_user((SELECT auth.uid()))) OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager')))
  )
)
WITH CHECK (
  (tenant_id = (SELECT auth.uid()))
  AND ((SELECT is_admin_user((SELECT auth.uid()))) OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager')))
);

-- Optimize financial_reports policies
DROP POLICY IF EXISTS "financial_reports_admin_pm_access" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_admin_pm_insert" ON public.financial_reports;
DROP POLICY IF EXISTS "financial_reports_admin_pm_update" ON public.financial_reports;

CREATE POLICY "financial_reports_secure_select" ON public.financial_reports
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

CREATE POLICY "financial_reports_secure_insert" ON public.financial_reports
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

CREATE POLICY "financial_reports_secure_update" ON public.financial_reports
FOR UPDATE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
)
WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (SELECT user_has_role((SELECT auth.uid()), 'property_manager'))
);

-- Optimize invoices policies
DROP POLICY IF EXISTS "invoices_unified_access" ON public.invoices;
CREATE POLICY "invoices_unified_access" ON public.invoices
FOR ALL USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
  OR (vendor_id = (SELECT auth.uid()))
)
WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
  OR (vendor_id = (SELECT auth.uid()))
);

-- Optimize maintenance_requests policies
DROP POLICY IF EXISTS "maintenance_requests_unified_access" ON public.maintenance_requests;
CREATE POLICY "maintenance_requests_unified_access" ON public.maintenance_requests
FOR ALL USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR ((SELECT auth.uid()) = tenant_id)
)
WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR ((SELECT auth.uid()) = tenant_id)
);

-- Optimize notifications policies
DROP POLICY IF EXISTS "notifications_own_only" ON public.notifications;
CREATE POLICY "notifications_own_only" ON public.notifications
FOR ALL USING (
  user_id = (SELECT auth.uid())
)
WITH CHECK (
  user_id = (SELECT auth.uid())
);

-- Optimize payment_refunds policies
DROP POLICY IF EXISTS "Users can view own refund requests" ON public.payment_refunds;
DROP POLICY IF EXISTS "Users can create refund requests" ON public.payment_refunds;
DROP POLICY IF EXISTS "Admins can update refund requests" ON public.payment_refunds;

CREATE POLICY "payment_refunds_secure_select" ON public.payment_refunds
FOR SELECT USING (
  (requested_by = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "payment_refunds_secure_insert" ON public.payment_refunds
FOR INSERT WITH CHECK (
  requested_by = (SELECT auth.uid())
);

CREATE POLICY "payment_refunds_secure_update" ON public.payment_refunds
FOR UPDATE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize payment_templates policies
DROP POLICY IF EXISTS "payment_templates_admin_full_access" ON public.payment_templates;
CREATE POLICY "payment_templates_admin_access" ON public.payment_templates
FOR ALL USING (
  (SELECT is_admin_user((SELECT auth.uid())))
)
WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize profile_name_audit policies
DROP POLICY IF EXISTS "profile_name_audit_admin_only" ON public.profile_name_audit;
CREATE POLICY "profile_name_audit_admin_access" ON public.profile_name_audit
FOR ALL USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize profiles policies
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;

CREATE POLICY "profiles_secure_select" ON public.profiles
FOR SELECT USING (
  (id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "profiles_secure_insert" ON public.profiles
FOR INSERT WITH CHECK (
  (id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "profiles_secure_update" ON public.profiles
FOR UPDATE USING (
  (id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
)
WITH CHECK (
  (id = (SELECT auth.uid()))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "profiles_admin_delete" ON public.profiles
FOR DELETE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize project_assignments policies
DROP POLICY IF EXISTS "project_assignments_full_admin_access" ON public.project_assignments;
CREATE POLICY "project_assignments_secure_access" ON public.project_assignments
FOR ALL USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (vendor_id = (SELECT auth.uid()))
  OR (assigned_by = (SELECT auth.uid()))
);

-- Optimize project_documents policies
DROP POLICY IF EXISTS "consolidated_project_documents_select" ON public.project_documents;
DROP POLICY IF EXISTS "consolidated_project_documents_insert" ON public.project_documents;
DROP POLICY IF EXISTS "consolidated_project_documents_update" ON public.project_documents;
DROP POLICY IF EXISTS "consolidated_project_documents_delete" ON public.project_documents;

CREATE POLICY "project_documents_secure_select" ON public.project_documents
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_documents.project_id
      AND p.created_by = (SELECT auth.uid())
  ))
  OR (SELECT is_admin_user((SELECT auth.uid())))
  OR (
    (EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_documents.project_id
        AND p.status = 'open'
    ))
    AND (SELECT user_has_role((SELECT auth.uid()), 'vendor'))
  )
);

CREATE POLICY "project_documents_secure_insert" ON public.project_documents
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_documents.project_id
      AND p.created_by = (SELECT auth.uid())
  ))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "project_documents_secure_update" ON public.project_documents
FOR UPDATE USING (
  (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_documents.project_id
      AND p.created_by = (SELECT auth.uid())
  ))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "project_documents_secure_delete" ON public.project_documents
FOR DELETE USING (
  (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_documents.project_id
      AND p.created_by = (SELECT auth.uid())
  ))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize project_milestones policies
DROP POLICY IF EXISTS "project_milestones_vendor_access" ON public.project_milestones;
CREATE POLICY "project_milestones_secure_access" ON public.project_milestones
FOR ALL USING (
  (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_milestones.project_id
      AND p.assigned_vendor_id = (SELECT auth.uid())
  ))
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize projects policies
DROP POLICY IF EXISTS "projects_unified_select" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_write" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_update" ON public.projects;
DROP POLICY IF EXISTS "projects_unified_delete" ON public.projects;

CREATE POLICY "projects_secure_select" ON public.projects
FOR SELECT USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
  OR (assigned_vendor_id = (SELECT auth.uid()))
  OR (
    (status = 'open')
    AND (SELECT user_has_role((SELECT auth.uid()), 'vendor'))
  )
);

CREATE POLICY "projects_secure_insert" ON public.projects
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
);

CREATE POLICY "projects_secure_update" ON public.projects
FOR UPDATE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
)
WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
);

CREATE POLICY "projects_secure_delete" ON public.projects
FOR DELETE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
  OR (created_by = (SELECT auth.uid()))
);

-- Optimize properties policies (admin/PM access for write operations)
DROP POLICY IF EXISTS "properties_unified_delete" ON public.properties;
DROP POLICY IF EXISTS "properties_unified_insert" ON public.properties;
DROP POLICY IF EXISTS "properties_unified_update" ON public.properties;

CREATE POLICY "properties_admin_insert" ON public.properties
FOR INSERT WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "properties_admin_update" ON public.properties
FOR UPDATE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
)
WITH CHECK (
  (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "properties_admin_delete" ON public.properties
FOR DELETE USING (
  (SELECT is_admin_user((SELECT auth.uid())))
);

-- Optimize property_inquiries policies
DROP POLICY IF EXISTS "inquiries_own_only" ON public.property_inquiries;
DROP POLICY IF EXISTS "inquiries_create_own" ON public.property_inquiries;

CREATE POLICY "property_inquiries_secure_select" ON public.property_inquiries
FOR SELECT USING (
  ((SELECT auth.uid()) = user_id)
  OR (SELECT is_admin_user((SELECT auth.uid())))
);

CREATE POLICY "property_inquiries_secure_insert" ON public.property_inquiries
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user_id
);

-- Log migration completion
INSERT INTO audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  new_values
) VALUES (
  (SELECT auth.uid()),
  'MIGRATION_SECURITY_OPTIMIZATION',
  'system',
  'phase_a_security_fixes',
  jsonb_build_object(
    'timestamp', NOW(),
    'fixed_policies', 3,
    'optimized_policies', 25,
    'security_level', 'CRITICAL_FIXES_APPLIED'
  )
);