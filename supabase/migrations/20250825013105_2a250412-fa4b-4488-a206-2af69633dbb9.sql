-- Fix security warnings for functions
-- Update is_admin function to fix search path issue
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update handle_new_user function to fix search path issue  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'tenant'),
    'active',
    now(),
    now()
  );

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role, granted_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'tenant'),
    now()
  );

  -- If vendor, create vendor profile
  IF COALESCE(new.raw_user_meta_data->>'role', 'tenant') = 'vendor' THEN
    INSERT INTO public.vendor_profiles (user_id, company_name, created_at)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'company_name',
      now()
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;