-- Fix search path for existing functions
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;