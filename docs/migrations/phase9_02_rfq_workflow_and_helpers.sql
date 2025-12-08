-- =====================================================
-- PHASE 9 - MIGRATION 2: RFQ WORKFLOW & HELPERS
-- =====================================================
-- Creates app schema, helper functions, and RFQ tables
-- Safe to run: Uses IF NOT EXISTS and CREATE OR REPLACE
-- =====================================================

-- 1. Create app schema for helper functions
CREATE SCHEMA IF NOT EXISTS app;

-- 2. Helper function: Get current user ID
CREATE OR REPLACE FUNCTION app.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid();
$$;

-- 3. Helper function: Get current user role
CREATE OR REPLACE FUNCTION app.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 4. Helper function: Get current tenant
CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Helper function: Check if user has role
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

-- 6. Create RFQs table
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

-- Enable RLS
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- RLS policies for RFQs
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

-- 7. Create RFQ Lots table
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

-- 8. Create RFQ Invitations table
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

-- 9. Create Bid Lines table
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

-- 10. Create Contracts table
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

-- 11. Create Compliance Documents table
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
-- VERIFICATION QUERIES (run these after migration)
-- =====================================================
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'app'; -- Should show 4 functions
-- SELECT app.user_id(), app.current_role(), app.current_tenant(); -- Should return your data
-- SELECT COUNT(*) FROM public.rfqs; -- Should return 0 (empty, but RLS working)
-- SELECT COUNT(*) FROM public.contracts; -- Should return 0
