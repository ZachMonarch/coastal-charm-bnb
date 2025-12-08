-- Create vendor_payment_methods table for storing payment method references
CREATE TABLE public.vendor_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'bank_account')),
  last_four TEXT NOT NULL,
  brand TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own payment methods" 
ON public.vendor_payment_methods 
FOR ALL 
USING (vendor_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_vendor_payment_methods_updated_at
  BEFORE UPDATE ON public.vendor_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();