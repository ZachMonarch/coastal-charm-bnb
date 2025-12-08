-- =====================================================
-- PHASE 9 FINAL COMPLETION MIGRATION
-- =====================================================
-- Creates all missing RFQ workflow tables, RPC functions, and audit triggers
-- Safe to run: Uses CREATE IF NOT EXISTS and CREATE OR REPLACE
-- =====================================================

-- 1. Create RFQs table
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'awarded')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_tenant_id ON public.rfqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_property_id ON public.rfqs(property_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfqs_tenant_staff" ON public.rfqs;
CREATE POLICY "rfqs_tenant_staff" ON public.rfqs
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

DROP POLICY IF EXISTS "rfqs_vendors_open" ON public.rfqs;
CREATE POLICY "rfqs_vendors_open" ON public.rfqs
  FOR SELECT
  TO authenticated
  USING (
    status = 'open'
    AND app.has_role('vendor')
    AND EXISTS (
      SELECT 1 FROM public.rfq_invites
      WHERE rfq_id = rfqs.id AND vendor_id = auth.uid()
    )
  );

-- 2. Create RFQ Lots table
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

DROP POLICY IF EXISTS "rfq_lots_access" ON public.rfq_lots;
CREATE POLICY "rfq_lots_access" ON public.rfq_lots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_lots.rfq_id
      AND (
        (r.tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
        OR (r.status = 'open' AND app.has_role('vendor'))
      )
    )
  );

-- 3. Create RFQ Invites table
CREATE TABLE IF NOT EXISTS public.rfq_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'bid_submitted', 'declined')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_invites_rfq_id ON public.rfq_invites(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_invites_vendor_id ON public.rfq_invites(vendor_id);

ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rfq_invites_tenant_staff" ON public.rfq_invites;
CREATE POLICY "rfq_invites_tenant_staff" ON public.rfq_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_invites.rfq_id
      AND r.tenant_id = app.current_tenant()
      AND (app.has_role('admin') OR app.has_role('property_manager'))
    )
  );

DROP POLICY IF EXISTS "rfq_invites_vendor_own" ON public.rfq_invites;
CREATE POLICY "rfq_invites_vendor_own" ON public.rfq_invites
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- 4. Create Bid Lines table
CREATE TABLE IF NOT EXISTS public.bid_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_lot_id UUID NOT NULL REFERENCES public.rfq_lots(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rfq_lot_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_bid_lines_rfq_lot_id ON public.bid_lines(rfq_lot_id);
CREATE INDEX IF NOT EXISTS idx_bid_lines_vendor_id ON public.bid_lines(vendor_id);

ALTER TABLE public.bid_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bid_lines_vendor_own" ON public.bid_lines;
CREATE POLICY "bid_lines_vendor_own" ON public.bid_lines
  FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "bid_lines_tenant_staff" ON public.bid_lines;
CREATE POLICY "bid_lines_tenant_staff" ON public.bid_lines
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

-- 5. Create Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  contract_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  contract_value NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
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

DROP POLICY IF EXISTS "contracts_tenant_staff" ON public.contracts;
CREATE POLICY "contracts_tenant_staff" ON public.contracts
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

DROP POLICY IF EXISTS "contracts_vendor_own" ON public.contracts;
CREATE POLICY "contracts_vendor_own" ON public.contracts
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- 6. Create Compliance Docs table
CREATE TABLE IF NOT EXISTS public.compliance_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('insurance', 'license', 'certification', 'bond', 'other')),
  doc_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compliance_docs_tenant_id ON public.compliance_docs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_vendor_id ON public.compliance_docs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_status ON public.compliance_docs(status);

ALTER TABLE public.compliance_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_docs_vendor_own" ON public.compliance_docs;
CREATE POLICY "compliance_docs_vendor_own" ON public.compliance_docs
  FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "compliance_docs_tenant_staff" ON public.compliance_docs;
CREATE POLICY "compliance_docs_tenant_staff" ON public.compliance_docs
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

-- 7. Create Work Orders table
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  property_id BIGINT REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON public.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_contract_id ON public.work_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON public.work_orders(assigned_to);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_orders_tenant_staff" ON public.work_orders;
CREATE POLICY "work_orders_tenant_staff" ON public.work_orders
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

DROP POLICY IF EXISTS "work_orders_vendor_assigned" ON public.work_orders;
CREATE POLICY "work_orders_vendor_assigned" ON public.work_orders
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- 8. Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_tenant_staff" ON public.payments;
CREATE POLICY "payments_tenant_staff" ON public.payments
  FOR ALL
  TO authenticated
  USING (
    tenant_id = app.current_tenant()
    AND (app.has_role('admin') OR app.has_role('property_manager'))
  );

-- 9. Create Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  related_to_type TEXT NOT NULL CHECK (related_to_type IN ('rfq', 'contract', 'work_order', 'compliance', 'property', 'other')),
  related_to_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_related_to ON public.documents(related_to_type, related_to_id);

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
-- RPC FUNCTIONS
-- =====================================================

-- RPC: Submit Bid
CREATE OR REPLACE FUNCTION app.submit_bid(
  p_rfq_id UUID,
  p_total_amount NUMERIC,
  p_bid_lines JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid_id UUID;
  v_line JSONB;
  v_vendor_id UUID;
BEGIN
  v_vendor_id := auth.uid();
  
  -- Check if vendor is invited
  IF NOT EXISTS (
    SELECT 1 FROM public.rfq_invites 
    WHERE rfq_id = p_rfq_id 
    AND vendor_id = v_vendor_id 
    AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Not invited to this RFQ';
  END IF;
  
  -- Check if RFQ is still open
  IF NOT EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE id = p_rfq_id 
    AND status = 'open' 
    AND deadline > now()
  ) THEN
    RAISE EXCEPTION 'RFQ is closed or deadline passed';
  END IF;
  
  -- Insert bid lines
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_bid_lines)
  LOOP
    INSERT INTO public.bid_lines (rfq_lot_id, vendor_id, unit_price, notes)
    VALUES (
      (v_line->>'rfq_lot_id')::uuid,
      v_vendor_id,
      (v_line->>'unit_price')::numeric,
      v_line->>'notes'
    );
  END LOOP;
  
  -- Update invite status
  UPDATE public.rfq_invites
  SET status = 'bid_submitted'
  WHERE rfq_id = p_rfq_id AND vendor_id = v_vendor_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    v_vendor_id,
    'BID_SUBMITTED',
    'bid_lines',
    p_rfq_id::text,
    jsonb_build_object('rfq_id', p_rfq_id, 'total_amount', p_total_amount)
  );
  
  RETURN p_rfq_id;
END;
$$;

-- RPC: Approve Invoice
CREATE OR REPLACE FUNCTION app.approve_invoice(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check authorization
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Not authorized to approve invoices';
  END IF;
  
  -- Update invoice
  UPDATE public.invoices
  SET 
    status = 'approved',
    updated_at = now()
  WHERE id = p_invoice_id
  AND tenant_id = app.current_tenant();
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    v_user_id,
    'INVOICE_APPROVED',
    'invoices',
    p_invoice_id::text,
    jsonb_build_object('approved_by', v_user_id, 'approved_at', now())
  );
END;
$$;

-- RPC: Create RFQ
CREATE OR REPLACE FUNCTION app.create_rfq(
  p_property_id BIGINT,
  p_title TEXT,
  p_description TEXT,
  p_deadline TIMESTAMPTZ,
  p_lots JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rfq_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
  v_lot JSONB;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app.current_tenant();
  
  -- Check authorization
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Not authorized to create RFQs';
  END IF;
  
  -- Insert RFQ
  INSERT INTO public.rfqs (tenant_id, property_id, title, description, deadline, created_by, status)
  VALUES (v_tenant_id, p_property_id, p_title, p_description, p_deadline, v_user_id, 'draft')
  RETURNING id INTO v_rfq_id;
  
  -- Insert lots
  FOR v_lot IN SELECT * FROM jsonb_array_elements(p_lots)
  LOOP
    INSERT INTO public.rfq_lots (rfq_id, lot_name, unit_of_measure, quantity, specifications)
    VALUES (
      v_rfq_id,
      v_lot->>'name',
      v_lot->>'uom',
      (v_lot->>'qty')::numeric,
      COALESCE(v_lot->'specs', '{}'::jsonb)
    );
  END LOOP;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    v_user_id,
    'RFQ_CREATED',
    'rfqs',
    v_rfq_id::text,
    jsonb_build_object('rfq_id', v_rfq_id, 'title', p_title)
  );
  
  RETURN v_rfq_id;
END;
$$;

-- RPC: Invite Vendors to RFQ
CREATE OR REPLACE FUNCTION app.invite_vendors_to_rfq(
  p_rfq_id UUID,
  p_vendor_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_vendor_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check authorization
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Not authorized to invite vendors';
  END IF;
  
  -- Check RFQ exists and belongs to user's tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.rfqs 
    WHERE id = p_rfq_id 
    AND tenant_id = app.current_tenant()
  ) THEN
    RAISE EXCEPTION 'RFQ not found or access denied';
  END IF;
  
  -- Insert invitations
  FOREACH v_vendor_id IN ARRAY p_vendor_ids
  LOOP
    INSERT INTO public.rfq_invites (rfq_id, vendor_id, invited_by)
    VALUES (p_rfq_id, v_vendor_id, v_user_id)
    ON CONFLICT (rfq_id, vendor_id) DO NOTHING;
  END LOOP;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    v_user_id,
    'VENDORS_INVITED',
    'rfq_invites',
    p_rfq_id::text,
    jsonb_build_object('rfq_id', p_rfq_id, 'vendor_count', array_length(p_vendor_ids, 1))
  );
END;
$$;

-- RPC: Award Contract
CREATE OR REPLACE FUNCTION app.award_contract(
  p_rfq_id UUID,
  p_vendor_id UUID,
  p_contract_value NUMERIC,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
  v_rfq_title TEXT;
  v_contract_number TEXT;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app.current_tenant();
  
  -- Check authorization
  IF NOT (app.has_role('admin') OR app.has_role('property_manager')) THEN
    RAISE EXCEPTION 'Not authorized to award contracts';
  END IF;
  
  -- Get RFQ details
  SELECT title INTO v_rfq_title
  FROM public.rfqs
  WHERE id = p_rfq_id AND tenant_id = v_tenant_id;
  
  IF v_rfq_title IS NULL THEN
    RAISE EXCEPTION 'RFQ not found';
  END IF;
  
  -- Generate contract number
  v_contract_number := 'CNT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTRING(p_rfq_id::text, 1, 8);
  
  -- Create contract
  INSERT INTO public.contracts (
    tenant_id, rfq_id, vendor_id, contract_number, title, 
    contract_value, start_date, end_date, status, created_by
  ) VALUES (
    v_tenant_id, p_rfq_id, p_vendor_id, v_contract_number, v_rfq_title,
    p_contract_value, p_start_date, p_end_date, 'draft', v_user_id
  ) RETURNING id INTO v_contract_id;
  
  -- Update RFQ status
  UPDATE public.rfqs SET status = 'awarded' WHERE id = p_rfq_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    v_user_id,
    'CONTRACT_AWARDED',
    'contracts',
    v_contract_id::text,
    jsonb_build_object('contract_id', v_contract_id, 'vendor_id', p_vendor_id)
  );
  
  RETURN v_contract_id;
END;
$$;

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Trigger: Audit RFQ Changes
CREATE OR REPLACE FUNCTION public.audit_rfq_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'RFQ_STATUS_CHANGE',
      'rfqs',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_rfq_changes ON public.rfqs;
CREATE TRIGGER trigger_audit_rfq_changes
  AFTER UPDATE ON public.rfqs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_rfq_changes();

-- Trigger: Audit Contract Changes
CREATE OR REPLACE FUNCTION public.audit_contract_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'CONTRACT_CREATED',
      'contracts',
      NEW.id::text,
      jsonb_build_object('contract_number', NEW.contract_number, 'vendor_id', NEW.vendor_id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'CONTRACT_STATUS_CHANGE',
      'contracts',
      NEW.id::text,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_contract_changes ON public.contracts;
CREATE TRIGGER trigger_audit_contract_changes
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_contract_changes();

-- =====================================================
-- VERIFICATION QUERIES (commented - run after migration)
-- =====================================================
-- SELECT COUNT(*) FROM public.rfqs; -- Should return 0 initially
-- SELECT COUNT(*) FROM public.contracts; -- Should return 0 initially
-- SELECT COUNT(*) FROM public.work_orders; -- Should return 0 initially
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'app' AND routine_name IN ('submit_bid', 'approve_invoice', 'create_rfq', 'invite_vendors_to_rfq', 'award_contract');
