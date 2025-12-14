-- Create subscription_requests table for vendor upgrade requests
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_plan TEXT,
  requested_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique partial index to prevent multiple pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_requests_pending 
ON public.subscription_requests (vendor_id) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own requests
CREATE POLICY "Vendors can view own subscription requests"
ON public.subscription_requests
FOR SELECT
USING (auth.uid() = vendor_id);

-- Vendors can insert their own requests
CREATE POLICY "Vendors can create subscription requests"
ON public.subscription_requests
FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all subscription requests"
ON public.subscription_requests
FOR SELECT
USING (public.is_admin_user(auth.uid()));

-- Admins can update all requests
CREATE POLICY "Admins can update subscription requests"
ON public.subscription_requests
FOR UPDATE
USING (public.is_admin_user(auth.uid()));

-- Add phone and SMS columns to profiles if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'sms_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN sms_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS update_subscription_requests_timestamp ON public.subscription_requests;
CREATE TRIGGER update_subscription_requests_timestamp
BEFORE UPDATE ON public.subscription_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_requests_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_vendor ON public.subscription_requests(vendor_id);