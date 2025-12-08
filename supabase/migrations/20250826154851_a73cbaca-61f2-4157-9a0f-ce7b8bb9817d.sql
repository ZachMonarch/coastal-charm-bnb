-- Fix properties table RLS policies to allow proper access for all authenticated users
-- First drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users view properties" ON properties;
DROP POLICY IF EXISTS "Anonymous property browsing" ON properties;

-- Create comprehensive property access policies
CREATE POLICY "Public can view available properties" 
ON properties FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can view all properties" 
ON properties FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix project visibility for vendors
DROP POLICY IF EXISTS "Project stakeholders only" ON projects;

CREATE POLICY "Enhanced project visibility" 
ON projects FOR SELECT 
USING (
  (auth.uid() = created_by) OR 
  (auth.uid() = assigned_vendor_id) OR 
  is_admin_user(auth.uid()) OR 
  user_has_role(auth.uid(), 'property_manager'::text) OR
  (status = 'open' AND user_has_role(auth.uid(), 'vendor'::text))
);

-- Add vendor application system policies for better access
CREATE POLICY "Vendors can view open applications" 
ON vendor_applications FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  is_admin_user(auth.uid()) OR
  (status = 'open' AND user_has_role(auth.uid(), 'vendor'::text))
);