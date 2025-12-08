-- Fix the admin profile role
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = '57f850b4-d457-450f-bdf1-7bd7e35c93d5';

-- Create a protected admins table to permanently protect certain users
CREATE TABLE IF NOT EXISTS public.protected_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  protected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  protected_by UUID REFERENCES auth.users(id),
  reason TEXT DEFAULT 'System administrator'
);

-- Enable RLS
ALTER TABLE public.protected_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view protected admins (no one can modify via API)
CREATE POLICY "protected_admins_admin_view" ON public.protected_admins
  FOR SELECT USING (is_admin_user(auth.uid()));

-- Insert the primary admin as protected
INSERT INTO public.protected_admins (user_id, reason)
VALUES ('57f850b4-d457-450f-bdf1-7bd7e35c93d5', 'Primary system administrator - cannot be modified')
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger to prevent role changes for protected admins
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this user is a protected admin
  IF EXISTS (SELECT 1 FROM protected_admins WHERE user_id = OLD.user_id) THEN
    -- Prevent deletion
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot remove role from protected administrator';
    END IF;
    
    -- Prevent role change from admin
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
      RAISE EXCEPTION 'Cannot change role of protected administrator';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to user_roles table
DROP TRIGGER IF EXISTS protect_admin_role_trigger ON user_roles;
CREATE TRIGGER protect_admin_role_trigger
  BEFORE UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_role();

-- Create trigger to prevent profile role changes for protected admins
CREATE OR REPLACE FUNCTION public.protect_admin_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this user is a protected admin
  IF EXISTS (SELECT 1 FROM protected_admins WHERE user_id = NEW.id) THEN
    -- Force role to remain admin
    IF NEW.role != 'admin' THEN
      NEW.role := 'admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS protect_admin_profile_role_trigger ON profiles;
CREATE TRIGGER protect_admin_profile_role_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_profile_role();

-- Log this security action
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
VALUES (
  '57f850b4-d457-450f-bdf1-7bd7e35c93d5',
  'ADMIN_PROTECTION_ENABLED',
  'protected_admins',
  '57f850b4-d457-450f-bdf1-7bd7e35c93d5',
  jsonb_build_object(
    'reason', 'Primary admin protected from role changes',
    'protected_at', NOW()
  )
);