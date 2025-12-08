-- Fix RLS performance issues by optimizing auth function calls
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- 1. Fix profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_manage_all_profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "admin_manage_all_profiles" ON public.profiles
  FOR ALL USING (is_admin_user((select auth.uid())));

-- 2. Fix bookings table policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- 3. Fix projects table policies
DROP POLICY IF EXISTS "Enhanced project visibility" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Creators can update their projects" ON public.projects;
DROP POLICY IF EXISTS "admin_manage_all_projects" ON public.projects;

CREATE POLICY "Enhanced project visibility" ON public.projects
  FOR SELECT USING (
    (select auth.uid()) = created_by OR 
    (select auth.uid()) = assigned_vendor_id OR 
    is_admin_user((select auth.uid())) OR 
    user_has_role((select auth.uid()), 'property_manager') OR 
    (status = 'open' AND user_has_role((select auth.uid()), 'vendor'))
  );

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Creators can update their projects" ON public.projects
  FOR UPDATE USING ((select auth.uid()) = created_by);

CREATE POLICY "admin_manage_all_projects" ON public.projects
  FOR ALL USING (is_admin_user((select auth.uid())));

-- 4. Fix vendor_applications table policies
DROP POLICY IF EXISTS "Users can create their own applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Vendors can view open applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Vendor application privacy" ON public.vendor_applications;
DROP POLICY IF EXISTS "admin_view_all_applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "admin_update_applications" ON public.vendor_applications;

CREATE POLICY "Users can create their own applications" ON public.vendor_applications
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Vendors can view open applications" ON public.vendor_applications
  FOR SELECT USING (
    (select auth.uid()) = user_id OR 
    is_admin_user((select auth.uid())) OR 
    (status = 'open' AND user_has_role((select auth.uid()), 'vendor'))
  );

CREATE POLICY "admin_view_all_applications" ON public.vendor_applications
  FOR SELECT USING (is_admin_user((select auth.uid())));

CREATE POLICY "admin_update_applications" ON public.vendor_applications
  FOR UPDATE USING (is_admin_user((select auth.uid())));

-- 5. Fix vendor_bids table policies
DROP POLICY IF EXISTS "Vendors can view their own bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Vendors can create their own bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Vendor bids secure access" ON public.vendor_bids;

CREATE POLICY "Vendors can view their own bids" ON public.vendor_bids
  FOR SELECT USING ((select auth.uid()) = vendor_id);

CREATE POLICY "Vendors can create their own bids" ON public.vendor_bids
  FOR INSERT WITH CHECK ((select auth.uid()) = vendor_id);

CREATE POLICY "Vendor bids secure access" ON public.vendor_bids
  FOR SELECT USING (
    (select auth.uid()) = vendor_id OR 
    EXISTS (
      SELECT 1 FROM vendor_applications va 
      WHERE va.id = vendor_bids.application_id AND 
      (va.user_id = (select auth.uid()) OR is_admin_user((select auth.uid())))
    ) OR 
    is_admin_user((select auth.uid()))
  );

-- Remove duplicate and redundant policies
DROP POLICY IF EXISTS "Vendor application privacy" ON public.vendor_applications;
DROP POLICY IF EXISTS "Bid creators can view their own bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Project creators can view bids for their projects" ON public.vendor_bids;
DROP POLICY IF EXISTS "Inquiry creators can view their own inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Admins can manage all vendor applications" ON public.vendor_applications;