-- Add missing RLS policies for tables that need them

-- Vendor applications policies
CREATE POLICY "Vendors can view all applications"
ON public.vendor_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'vendor'
  )
);

-- Vendor bids policies  
CREATE POLICY "Vendors can view all bids"
ON public.vendor_bids
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'vendor'
  )
);

-- Projects policies
CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Property managers can view projects they created"
ON public.projects
FOR SELECT
TO authenticated
USING (
  (auth.uid() = created_by) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Vendors can view assigned projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  (auth.uid() = assigned_vendor_id) OR 
  (auth.uid() = created_by) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'property_manager')
  )
);

CREATE POLICY "Admins and creators can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) OR (auth.uid() = created_by)
);

CREATE POLICY "Admins can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Project assignments policies
CREATE POLICY "Users can view their assignments"
ON public.project_assignments
FOR SELECT
TO authenticated
USING (
  (vendor_id = auth.uid()) OR 
  (assigned_by = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can create assignments"
ON public.project_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'property_manager')
  )
);

CREATE POLICY "Admins can update assignments"
ON public.project_assignments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) OR (assigned_by = auth.uid())
);