-- Fix security warnings by adding search_path to functions
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.prevent_admin_signup() SET search_path = 'public';