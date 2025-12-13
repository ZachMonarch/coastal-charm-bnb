-- Create vendor_inquiries table for vendor messaging/support system
CREATE TABLE IF NOT EXISTS public.vendor_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'project_update_report',
    'needs',
    'complaints',
    'support',
    'assistance',
    'inquiries',
    'other'
  )),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  responded_by UUID REFERENCES public.profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vendor_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_inquiries
-- Vendors can view their own inquiries
CREATE POLICY "Vendors can view own inquiries" ON public.vendor_inquiries
  FOR SELECT USING (vendor_id = auth.uid());

-- Vendors can create their own inquiries  
CREATE POLICY "Vendors can create own inquiries" ON public.vendor_inquiries
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

-- Vendors can update their own open inquiries (add more details)
CREATE POLICY "Vendors can update own open inquiries" ON public.vendor_inquiries
  FOR UPDATE USING (vendor_id = auth.uid() AND status = 'open');

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries" ON public.vendor_inquiries
  FOR SELECT USING (public.is_admin_user(auth.uid()));

-- Admins can update any inquiry (respond, change status)
CREATE POLICY "Admins can update all inquiries" ON public.vendor_inquiries
  FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor_id ON public.vendor_inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_status ON public.vendor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_category ON public.vendor_inquiries(category);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_created_at ON public.vendor_inquiries(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_vendor_inquiry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_vendor_inquiries_updated_at
  BEFORE UPDATE ON public.vendor_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_inquiry_timestamp();