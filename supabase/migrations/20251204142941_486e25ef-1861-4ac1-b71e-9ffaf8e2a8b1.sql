-- Fix Function Search Path for update_quick_quote_updated_at
-- This addresses the security warning: Function Search Path Mutable

CREATE OR REPLACE FUNCTION public.update_quick_quote_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;