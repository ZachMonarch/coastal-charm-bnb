-- Phase 1: Fix Properties Table RLS for Public Viewing
-- Allow unauthenticated users to view available properties

-- Add permissive policy for public SELECT on available properties
CREATE POLICY "properties_public_view_available" 
ON public.properties
FOR SELECT
TO public
USING (status = 'available' OR status IS NULL);

-- Also add policy for authenticated users to view all properties they should see
CREATE POLICY "properties_authenticated_view" 
ON public.properties
FOR SELECT
TO authenticated
USING (
  -- Authenticated users can see available properties
  status = 'available' 
  OR status IS NULL
  -- Admins can see all properties
  OR is_admin_user(auth.uid())
  -- Property managers can see all properties
  OR user_has_role('property_manager')
  -- Owners can see their own properties
  OR owner_id = auth.uid()::text
);