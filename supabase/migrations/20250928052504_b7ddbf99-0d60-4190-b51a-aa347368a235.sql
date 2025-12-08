-- Create vendor_payouts table for tracking payment disbursements
CREATE TABLE public.vendor_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference TEXT,
  transaction_id TEXT,
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add milestone and project references to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS milestone_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS vendor_id UUID,
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'milestone' CHECK (invoice_type IN ('milestone', 'project', 'other'));

-- Enable RLS on vendor_payouts
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_payouts
CREATE POLICY "vendor_payouts_admin_access" ON public.vendor_payouts
FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "vendor_payouts_vendor_own" ON public.vendor_payouts
FOR SELECT USING (vendor_id = auth.uid());

-- Update invoice policies to include vendor access
CREATE POLICY "invoices_vendor_own" ON public.invoices
FOR ALL USING (vendor_id = auth.uid())
WITH CHECK (vendor_id = auth.uid());

-- Add foreign key constraints
ALTER TABLE public.vendor_payouts 
ADD CONSTRAINT vendor_payouts_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_milestone_id_fkey 
FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE SET NULL;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add update trigger for vendor_payouts
CREATE TRIGGER update_vendor_payouts_updated_at
BEFORE UPDATE ON public.vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
CREATE INDEX idx_vendor_payouts_status ON public.vendor_payouts(status);
CREATE INDEX idx_invoices_milestone_id ON public.invoices(milestone_id);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX idx_invoices_vendor_id ON public.invoices(vendor_id);