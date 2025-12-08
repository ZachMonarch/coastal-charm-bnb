-- Add missing RLS policies for new tables
CREATE POLICY "Users can view their roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can view their profile" ON public.vendor_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Vendors can update their profile" ON public.vendor_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all vendor profiles" ON public.vendor_profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create business-critical tables for production functionality
-- Bookings/Reservations table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES public.properties(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  special_requests TEXT,
  guest_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Property inquiries table
CREATE TABLE public.property_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id BIGINT REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'viewing', 'rental', 'purchase')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor applications/RFQ system
CREATE TABLE public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_description TEXT NOT NULL,
  project_type TEXT NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  preferred_start_date DATE,
  location TEXT,
  property_id BIGINT REFERENCES public.properties(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  deadline TIMESTAMPTZ
);

-- Vendor bids for applications
CREATE TABLE public.vendor_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.vendor_applications(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  estimated_duration TEXT,
  proposal_details TEXT NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.vendor_applications(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create performance indexes
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in_date, check_out_date);

CREATE INDEX idx_inquiries_property_id ON public.property_inquiries(property_id);
CREATE INDEX idx_inquiries_status ON public.property_inquiries(status);

CREATE INDEX idx_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX idx_applications_status ON public.vendor_applications(status);

CREATE INDEX idx_bids_application_id ON public.vendor_bids(application_id);
CREATE INDEX idx_bids_vendor_id ON public.vendor_bids(vendor_id);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);