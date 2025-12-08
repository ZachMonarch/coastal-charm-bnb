-- Fix security issues: Set proper search path for existing functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;