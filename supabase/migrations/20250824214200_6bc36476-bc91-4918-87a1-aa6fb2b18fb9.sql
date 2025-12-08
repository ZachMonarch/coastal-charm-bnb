-- Create or replace function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    'active',
    NOW(),
    NOW()
  );
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    NOW()
  );
  
  -- If user is a vendor, create vendor profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'vendor' THEN
    INSERT INTO public.vendor_profiles (
      user_id, 
      company_name, 
      specialties, 
      service_areas,
      is_verified,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company_name',
      ARRAY[]::text[],
      ARRAY[]::text[],
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to prevent admin signup
CREATE OR REPLACE FUNCTION public.prevent_admin_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent new admin signups unless created by existing admin
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'tenant') = 'admin' THEN
    -- Check if there's a valid admin session creating this user
    -- For now, we'll just prevent all admin signups via regular signup
    RAISE EXCEPTION 'Admin accounts cannot be created through regular signup';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent admin signup
DROP TRIGGER IF EXISTS prevent_admin_signup_trigger ON auth.users;
CREATE TRIGGER prevent_admin_signup_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_signup();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for vendor_profiles
DROP POLICY IF EXISTS "Vendors can view own profile" ON public.vendor_profiles;
CREATE POLICY "Vendors can view own profile" ON public.vendor_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendor_profiles;
CREATE POLICY "Vendors can update own profile" ON public.vendor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all vendor profiles" ON public.vendor_profiles;
CREATE POLICY "Admins can view all vendor profiles" ON public.vendor_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );