-- Create comprehensive user profiles and roles system
-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  role TEXT DEFAULT 'tenant' CHECK (role IN ('admin', 'property_manager', 'tenant', 'vendor', 'property_owner')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table for granular permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'property_manager', 'tenant', 'vendor', 'property_owner')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Vendor profiles for business users
CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_license TEXT,
  specialties TEXT[],
  service_areas TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.0,
  completed_jobs INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  insurance_verified BOOLEAN DEFAULT false,
  background_check_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = $2
  );
$$;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();