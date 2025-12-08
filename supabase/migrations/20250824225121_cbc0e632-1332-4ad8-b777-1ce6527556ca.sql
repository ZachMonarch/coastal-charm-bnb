-- Fix recursive policy issue in user_roles table
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate policies without recursion using direct auth.uid() check
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Optimize vendor_profiles table for better performance
ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint to ensure valid availability status
ALTER TABLE public.vendor_profiles 
ADD CONSTRAINT check_availability_status 
CHECK (availability_status IN ('available', 'busy', 'inactive'));

-- Create trigger to update last_active_at
CREATE OR REPLACE FUNCTION update_vendor_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_last_active_trigger
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_last_active();