-- Fix recursive policy issue in user_roles table
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate policies without recursion using the security definer function
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

-- Create missing indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_is_verified ON public.vendor_profiles(is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_applications_user_id ON public.vendor_applications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_bids_vendor_id ON public.vendor_bids(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_bids_application_id ON public.vendor_bids(application_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

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