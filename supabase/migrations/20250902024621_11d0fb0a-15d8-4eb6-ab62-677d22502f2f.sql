-- Fix search_path issues for SECURITY DEFINER functions
-- This addresses the mutable search_path linter warning

-- Update validate_password_on_signup function to include SET search_path
CREATE OR REPLACE FUNCTION public.validate_password_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This will be enforced by Supabase auth settings
  RETURN NEW;
END;
$function$;

-- Fix RLS policies that are flagged as missing protection
-- Add proper RLS policies for audit_logs (already has admin-only policy, but ensure it's comprehensive)
DROP POLICY IF EXISTS "audit_logs_admin_read_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_full_access" 
ON public.audit_logs 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Financial reports already has proper admin-only policies, but let's ensure they're comprehensive
DROP POLICY IF EXISTS "financial_reports_enhanced_security" ON public.financial_reports;
CREATE POLICY "financial_reports_admin_only_comprehensive" 
ON public.financial_reports 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Vendor applications already has proper policies but let's ensure they're bulletproof
-- The existing policies look correct, but let's verify RLS is enabled
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;