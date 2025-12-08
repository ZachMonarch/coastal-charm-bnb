-- =====================================================
-- PHASE 9 - MIGRATION 3: RPC FUNCTIONS & TRIGGERS
-- =====================================================
-- Creates work orders, payments, documents tables, RPC functions, and audit triggers
-- Safe to run: Uses CREATE OR REPLACE and IF NOT EXISTS
-- =====================================================

-- 1. Create Work Orders table
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

-- 2. Create Payments table
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

-- 3. Create Documents table
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

-- 4. RPC Function: Submit Bid
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

-- 5. RPC Function: Approve Invoice
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

-- 6. RPC Function: Create RFQ
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

-- 7. RPC Function: Invite Vendors to RFQ
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

-- 8. Create audit trigger for RFQs
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

-- 9. Create audit trigger for Contracts
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

-- 10. Update existing projects RLS to work with new structure
DROP POLICY IF EXISTS "projects_unified_access" ON public.projects;
CREATE POLICY "projects_unified_access" ON public.projects
  FOR ALL
  TO authenticated
  USING (
    is_admin_user(auth.uid())
    OR user_has_role(auth.uid(), 'property_manager')
    OR created_by = auth.uid()
    OR assigned_vendor_id = auth.uid()
    OR (status = 'open' AND user_has_role(auth.uid(), 'vendor'))
  )
  WITH CHECK (
    is_admin_user(auth.uid())
    OR user_has_role(auth.uid(), 'property_manager')
    OR created_by = auth.uid()
  );

-- =====================================================
-- MANUAL STEP REQUIRED: Create Storage Buckets
-- =====================================================
-- Go to Supabase Dashboard → Storage → Create bucket:
-- 1. Bucket name: "documents" (Private)
-- 2. Bucket name: "media" (Public)
--
-- Then add RLS policies via Storage → Policies

-- =====================================================
-- VERIFICATION QUERIES (run these after migration)
-- =====================================================
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'app'; -- Should show 8 functions
-- SELECT COUNT(*) FROM public.work_orders; -- Should return 0
-- SELECT COUNT(*) FROM public.payments; -- Should return 0
-- SELECT COUNT(*) FROM public.documents; -- Should return 0
