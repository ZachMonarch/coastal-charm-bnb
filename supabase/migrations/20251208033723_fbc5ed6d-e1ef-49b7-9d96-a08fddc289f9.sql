-- Fix duplicate indexes detected by Supabase Advisor
-- These duplicate indexes waste storage and slow down INSERT/UPDATE operations

-- Drop duplicate index on bookings table (keep idx_bookings_user_id)
DROP INDEX IF EXISTS public.idx_bookings_user_idx;

-- Drop duplicate index on projects table (keep idx_projects_assigned_vendor_id)
DROP INDEX IF EXISTS public.idx_projects_assigned_vendor;

-- Drop duplicate index on user_roles table (keep idx_user_roles_user_id_role)
DROP INDEX IF EXISTS public.idx_user_roles_user_role;