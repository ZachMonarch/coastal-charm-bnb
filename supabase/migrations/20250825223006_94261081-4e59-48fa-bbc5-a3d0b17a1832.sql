-- Create missing business tables for full functionality

-- Create invoices table for invoice management
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  description TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can create their own invoices" ON public.invoices
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all invoices" ON public.invoices
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'general', 'emergency')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_vendor_id UUID,
  assigned_vendor_name TEXT,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  cost_estimate DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  images TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance_requests
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance requests
CREATE POLICY "Tenants can create their own requests" ON public.maintenance_requests
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view their own requests" ON public.maintenance_requests
  FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Property managers can view all requests" ON public.maintenance_requests
  FOR SELECT
  USING (user_has_role(auth.uid(), 'property_manager') OR is_admin_user(auth.uid()));

CREATE POLICY "Property managers can update requests" ON public.maintenance_requests
  FOR UPDATE
  USING (user_has_role(auth.uid(), 'property_manager') OR is_admin_user(auth.uid()));

CREATE POLICY "Vendors can view assigned requests" ON public.maintenance_requests
  FOR SELECT
  USING (auth.uid() = assigned_vendor_id OR user_has_role(auth.uid(), 'vendor'));

CREATE POLICY "Admins can manage all requests" ON public.maintenance_requests
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Create financial_reports table for advanced reporting
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_expenses DECIMAL(15,2) DEFAULT 0,
  net_profit DECIMAL(15,2) DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on financial_reports
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage financial reports" ON public.financial_reports
  FOR ALL
  USING (is_admin_user(auth.uid()) OR user_has_role(auth.uid(), 'property_manager'))
  WITH CHECK (is_admin_user(auth.uid()) OR user_has_role(auth.uid(), 'property_manager'));

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON public.financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX idx_maintenance_requests_tenant_id ON public.maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON public.maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_assigned_vendor ON public.maintenance_requests(assigned_vendor_id);

CREATE INDEX idx_financial_reports_generated_by ON public.financial_reports(generated_by);
CREATE INDEX idx_financial_reports_period ON public.financial_reports(period_start, period_end);