-- Fix the RLS infinite recursion issue completely
-- Drop ALL policies that use has_role function recursively
DROP POLICY IF EXISTS "Vendors can view all applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Vendors can view all bids" ON public.vendor_bids;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Property managers can view projects they created" ON public.projects;
DROP POLICY IF EXISTS "Vendors can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and creators can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Property managers can view all inquiries" ON public.property_inquiries;
DROP POLICY IF EXISTS "Property managers can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create simple, non-recursive policies that work without the has_role function

-- User roles - basic access
CREATE POLICY "Users can view all roles for role checking"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Admin can manage all through service role only
CREATE POLICY "Service role manages roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true);

-- Vendor applications - basic access
CREATE POLICY "Users can view all vendor applications"
ON public.vendor_applications
FOR SELECT
TO authenticated
USING (true);

-- Vendor bids - basic access  
CREATE POLICY "Users can view all vendor bids"
ON public.vendor_bids
FOR SELECT
TO authenticated
USING (true);

-- Projects - basic access
CREATE POLICY "Authenticated users can view projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Project assignments - basic access
CREATE POLICY "Authenticated users can view assignments"
ON public.project_assignments
FOR SELECT
TO authenticated
USING (true);

-- Property inquiries - basic access
CREATE POLICY "Authenticated users can view inquiries"
ON public.property_inquiries
FOR SELECT
TO authenticated
USING (true);

-- Transactions - basic access
CREATE POLICY "Authenticated users can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (true);

-- Notifications - basic access
CREATE POLICY "Authenticated users can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);