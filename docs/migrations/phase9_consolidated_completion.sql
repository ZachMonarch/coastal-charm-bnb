-- =====================================================
-- PHASE 9 - CONSOLIDATED COMPLETION MIGRATION
-- =====================================================
-- Completes Migration 2 (RFQ tables) and Migration 3 (work orders, payments, RPCs)
-- Safe to run: Uses IF NOT EXISTS, CREATE OR REPLACE, and idempotent operations
-- =====================================================

-- =====================================================
-- PART 1: COMPLETE MIGRATION 2 (RFQ WORKFLOW)
-- =====================================================

-- 1. Ensure app schema exists
CREATE SCHEMA IF NOT EXISTS app;

-- 2. Fix app.current_tenant() to return proper UUID
CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Ensure all helper functions exist
CREATE OR REPLACE FUNCTION app.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION app.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.has_role(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND (role = check_role OR role = 'admin')
  );
$$;

-- 4. Create RFQs table
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'cancelled')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_tenant_id ON public.rfqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_by ON public.rfqs(created_by);

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfqs_tenant_staff_access" ON public.rfqs;
CREATE POLICY "rfqs_tenant_staff_access" ON public.rfqs
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

DROP POLICY IF EXISTS "rfqs_vendor_invited_view" ON public.rfqs;
CREATE POLICY "rfqs_vendor_invited_view" ON public.rfqs
  FOR SELECT
  TO authenticated
  USING (
    app.has_role('vendor')
    AND EXISTS (
      SELECT 1 FROM public.rfq_invites
      WHERE rfq_id = rfqs.id AND vendor_id = auth.uid() AND status = 'invited'
    )
  );

-- 5. Create RFQ Lots table
CREATE TABLE IF NOT EXISTS public.rfq_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  lot_name TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_lots_rfq_id ON public.rfq_lots(rfq_id);

ALTER TABLE public.rfq_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_lots_follow_rfq_access" ON public.rfq_lots;
CREATE POLICY "rfq_lots_follow_rfq_access" ON public.rfq_lots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_lots.rfq_id)
  );

-- 6. Create RFQ Invitations table
CREATE TABLE IF NOT EXISTS public.rfq_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'viewed', 'bid_submitted', 'declined')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_invites_rfq_id ON public.rfq_invites(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_invites_vendor_id ON public.rfq_invites(vendor_id);

ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_invites_staff_manage" ON public.rfq_invites;
CREATE POLICY "rfq_invites_staff_manage" ON public.rfq_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs 
      WHERE id = rfq_invites.rfq_id 
      AND tenant_id = app.current_tenant()
      AND (app.has_role('admin') OR app.has_role('property_manager'))
    )
  );

DROP POLICY IF EXISTS "rfq_invites_vendor_view_own" ON public.rfq_invites;
CREATE POLICY "rfq_invites_vendor_view_own" ON public.rfq_invites
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- 7. Create Bid Lines table
CREATE TABLE IF NOT EXISTS public.bid_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_lot_id UUID NOT NULL REFERENCES public.rfq_lots(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bid_lines_rfq_lot_id ON public.bid_lines(rfq_lot_id);
CREATE INDEX IF NOT EXISTS idx_bid_lines_vendor_id ON public.bid_lines(vendor_id);

ALTER TABLE public.bid_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bid_lines_vendor_own" ON public.bid_lines;
CREATE POLICY "bid_lines_vendor_own" ON public.bid_lines
  FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "bid_lines_staff_view" ON public.bid_lines;
CREATE POLICY "bid_lines_staff_view" ON public.bid_lines
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_lots rl
      JOIN public.rfqs r ON r.id = rl.rfq_id
      WHERE rl.id = bid_lines.rfq_lot_id
      AND r.tenant_id = app.current_tenant()
      AND (app.has_role('admin') OR app.has_role('property_manager'))
    )
  );

-- 8. Create Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
  terms JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON public.contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_rfq_id ON public.contracts(rfq_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_tenant_staff_manage" ON public.contracts;
CREATE POLICY "contracts_tenant_staff_manage" ON public.contracts
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

DROP POLICY IF EXISTS "contracts_vendor_view_own" ON public.contracts;
CREATE POLICY "contracts_vendor_view_own" ON public.contracts
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- 9. Create Compliance Documents table
CREATE TABLE IF NOT EXISTS public.compliance_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('insurance', 'license', 'certification', 'bond', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_docs_vendor_id ON public.compliance_docs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_status ON public.compliance_docs(status);

ALTER TABLE public.compliance_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_docs_vendor_own" ON public.compliance_docs;
CREATE POLICY "compliance_docs_vendor_own" ON public.compliance_docs
  FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "compliance_docs_staff_view" ON public.compliance_docs;
CREATE POLICY "compliance_docs_staff_view" ON public.compliance_docs
  FOR SELECT
  TO authenticated
  USING (
    app.has_role('admin') OR app.has_role('property_manager')
  );

-- =====================================================
-- PART 2: MIGRATION 3 (WORK ORDERS, PAYMENTS, DOCUMENTS)
-- =====================================================

-- 10. Create Work Orders table
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  property_id BIGINT REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON public.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON public.work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_project_id ON public.work_orders(project_id);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_orders_tenant_access" ON public.work_orders;
CREATE POLICY "work_orders_tenant_access" ON public.work_orders
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager') OR assigned_to = auth.uid())
  );

-- 11. Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('milestone', 'invoice', 'deposit', 'final', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON public.payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_tenant_staff" ON public.payments;
CREATE POLICY "payments_tenant_staff" ON public.payments
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

DROP POLICY IF EXISTS "payments_vendor_view" ON public.payments;
CREATE POLICY "payments_vendor_view" ON public.payments
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- 12. Create Documents table (unified document management)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'contract', 'rfq', 'work_order', 'vendor', 'property', 'other')),
  entity_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  document_type TEXT,
  is_public BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_tenant_access" ON public.documents;
CREATE POLICY "documents_tenant_access" ON public.documents
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    OR uploaded_by = auth.uid()
  );

-- =====================================================
-- PART 3: RPC FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- 13. RPC: Submit Bid (vendor action)
CREATE OR REPLACE FUNCTION public.submit_bid(
  p_rfq_id UUID,
  p_bid_lines JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id UUID;
  v_tenant_id UUID;
  v_bid_line JSONB;
  result JSON;
BEGIN
  v_vendor_id := auth.uid();
  
  -- Verify vendor is invited
  IF NOT EXISTS (
    SELECT 1 FROM rfq_invites 
    WHERE rfq_id = p_rfq_id AND vendor_id = v_vendor_id AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Not invited to this RFQ';
  END IF;
  
  -- Get tenant_id
  SELECT tenant_id INTO v_tenant_id FROM rfqs WHERE id = p_rfq_id;
  
  -- Insert bid lines
  FOR v_bid_line IN SELECT * FROM jsonb_array_elements(p_bid_lines)
  LOOP
    INSERT INTO bid_lines (rfq_lot_id, vendor_id, unit_price, notes)
    VALUES (
      (v_bid_line->>'lot_id')::UUID,
      v_vendor_id,
      (v_bid_line->>'unit_price')::NUMERIC,
      v_bid_line->>'notes'
    );
  END LOOP;
  
  -- Update invite status
  UPDATE rfq_invites 
  SET status = 'bid_submitted'
  WHERE rfq_id = p_rfq_id AND vendor_id = v_vendor_id;
  
  -- Audit log
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (v_vendor_id, 'BID_SUBMITTED', 'rfqs', p_rfq_id::TEXT, 
    jsonb_build_object('bid_lines_count', jsonb_array_length(p_bid_lines)));
  
  result := json_build_object(
    'success', true,
    'message', 'Bid submitted successfully',
    'rfq_id', p_rfq_id
  );
  
  RETURN result;
END;
$$;

-- 14. RPC: Award Contract (admin/PM action)
CREATE OR REPLACE FUNCTION public.award_contract(
  p_rfq_id UUID,
  p_vendor_id UUID,
  p_contract_number TEXT,
  p_title TEXT,
  p_total_amount NUMERIC,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_contract_id UUID;
  result JSON;
BEGIN
  -- Authorization check
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Property Manager access required';
  END IF;
  
  -- Get tenant_id
  SELECT tenant_id INTO v_tenant_id FROM rfqs WHERE id = p_rfq_id;
  
  -- Create contract
  INSERT INTO contracts (
    tenant_id, rfq_id, vendor_id, contract_number, title, 
    total_amount, start_date, end_date, status, created_by
  ) VALUES (
    v_tenant_id, p_rfq_id, p_vendor_id, p_contract_number, p_title,
    p_total_amount, p_start_date, p_end_date, 'active', auth.uid()
  ) RETURNING id INTO v_contract_id;
  
  -- Update RFQ status
  UPDATE rfqs SET status = 'awarded' WHERE id = p_rfq_id;
  
  -- Audit log
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), 'CONTRACT_AWARDED', 'contracts', v_contract_id::TEXT,
    jsonb_build_object('rfq_id', p_rfq_id, 'vendor_id', p_vendor_id, 'amount', p_total_amount));
  
  result := json_build_object(
    'success', true,
    'message', 'Contract awarded successfully',
    'contract_id', v_contract_id
  );
  
  RETURN result;
END;
$$;

-- 15. RPC: Approve Invoice (admin/PM action)
CREATE OR REPLACE FUNCTION public.approve_invoice(
  p_invoice_id UUID,
  p_approved BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Authorization check
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Property Manager access required';
  END IF;
  
  -- Update invoice status
  UPDATE invoices 
  SET 
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    updated_at = now()
  WHERE id = p_invoice_id;
  
  -- Audit log
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), 'INVOICE_' || CASE WHEN p_approved THEN 'APPROVED' ELSE 'REJECTED' END,
    'invoices', p_invoice_id::TEXT, jsonb_build_object('notes', p_notes));
  
  result := json_build_object(
    'success', true,
    'message', CASE WHEN p_approved THEN 'Invoice approved' ELSE 'Invoice rejected' END,
    'invoice_id', p_invoice_id
  );
  
  RETURN result;
END;
$$;

-- 16. RPC: Update Project Status with validation
CREATE OR REPLACE FUNCTION public.update_project_status(
  p_project_id UUID,
  p_new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
  result JSON;
BEGIN
  -- Authorization check
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Unauthorized: Admin or Property Manager access required';
  END IF;
  
  -- Get current status
  SELECT status INTO v_old_status FROM projects WHERE id = p_project_id;
  
  -- Update status
  UPDATE projects 
  SET status = p_new_status, updated_at = now()
  WHERE id = p_project_id;
  
  -- Audit log
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), 'PROJECT_STATUS_UPDATE', 'projects', p_project_id::TEXT,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_new_status));
  
  result := json_build_object(
    'success', true,
    'message', 'Project status updated',
    'project_id', p_project_id,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
  
  RETURN result;
END;
$$;

-- =====================================================
-- PART 4: AUDIT TRIGGERS
-- =====================================================

-- 17. Trigger: Audit contract changes
CREATE OR REPLACE FUNCTION audit_contract_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'CONTRACT_UPDATE', 'contracts', NEW.id::TEXT,
      to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_contract_changes ON public.contracts;
CREATE TRIGGER trigger_audit_contract_changes
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION audit_contract_changes();

-- 18. Trigger: Audit payment changes
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'PAYMENT_STATUS_CHANGE', 'payments', NEW.id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_payment_changes ON public.payments;
CREATE TRIGGER trigger_audit_payment_changes
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_payment_changes();

-- 19. Trigger: Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_rfqs_updated_at ON public.rfqs;
CREATE TRIGGER trigger_update_rfqs_updated_at
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_contracts_updated_at ON public.contracts;
CREATE TRIGGER trigger_update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER trigger_update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 5: ENHANCED PROJECT RLS FOR TENANT ISOLATION
-- =====================================================

-- 20. Update projects policies to include tenant checks
DROP POLICY IF EXISTS "projects_tenant_isolated_select" ON public.projects;
CREATE POLICY "projects_tenant_isolated_select" ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user(auth.uid())
    OR created_by = auth.uid()
    OR assigned_vendor_id = auth.uid()
    OR (
      (status = 'open' AND user_has_role(auth.uid(), 'vendor'))
      AND (tenant_id = app.current_tenant() OR tenant_id IS NULL)
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify success:
-- 
-- SELECT COUNT(*) FROM public.rfqs;
-- SELECT COUNT(*) FROM public.work_orders;
-- SELECT COUNT(*) FROM public.payments;
-- SELECT COUNT(*) FROM public.documents;
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'app';
-- SELECT proname FROM pg_proc WHERE proname IN ('submit_bid', 'award_contract', 'approve_invoice', 'update_project_status');
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('rfqs', 'work_orders', 'payments');
