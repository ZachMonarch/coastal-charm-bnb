-- Fix authentication and profile creation issues
-- First, drop problematic policies that might cause infinite recursion

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Add simple, non-recursive policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policy for admins to view all profiles using a function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

-- Ensure audit_logs and system_health have proper policies
CREATE POLICY "System can manage audit logs" 
ON public.audit_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "System can manage system health" 
ON public.system_health 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view system health" 
ON public.system_health 
FOR SELECT 
USING (public.is_admin());

-- Fix payment_documents policies
CREATE POLICY "Users can manage their own payment documents" 
ON public.payment_documents 
FOR ALL 
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Ensure user signup trigger exists and works properly
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();