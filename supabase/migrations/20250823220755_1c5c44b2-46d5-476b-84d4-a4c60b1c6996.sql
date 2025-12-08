-- Create vendor payments table
CREATE TABLE public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL, -- 'background_check', 'service_fee', 'security_bond', 'osha_certification', 'custom'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  template_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create payment templates table
CREATE TABLE public.payment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment documents table
CREATE TABLE public.payment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.vendor_payments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_payments
CREATE POLICY "Vendors can view their own payments" 
ON public.vendor_payments FOR SELECT 
USING (vendor_id = auth.uid());

CREATE POLICY "Admins can manage all payments" 
ON public.vendor_payments FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- RLS policies for payment_templates  
CREATE POLICY "Admins can manage payment templates" 
ON public.payment_templates FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Users can view active templates" 
ON public.payment_templates FOR SELECT 
USING (is_active = true);

-- RLS policies for payment_documents
CREATE POLICY "Users can view payment documents for their payments" 
ON public.payment_documents FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_payments vp 
    WHERE vp.id = payment_documents.payment_id 
    AND (vp.vendor_id = auth.uid() OR has_role(auth.uid(), 'admin'::text))
  )
);

CREATE POLICY "Admins can manage payment documents" 
ON public.payment_documents FOR ALL 
USING (has_role(auth.uid(), 'admin'::text));

-- Create indexes for better performance
CREATE INDEX idx_vendor_payments_vendor_id ON public.vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_status ON public.vendor_payments(status);
CREATE INDEX idx_vendor_payments_due_date ON public.vendor_payments(due_date);
CREATE INDEX idx_payment_documents_payment_id ON public.payment_documents(payment_id);

-- Create function to update timestamps
CREATE TRIGGER update_vendor_payments_updated_at
BEFORE UPDATE ON public.vendor_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_templates_updated_at
BEFORE UPDATE ON public.payment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();