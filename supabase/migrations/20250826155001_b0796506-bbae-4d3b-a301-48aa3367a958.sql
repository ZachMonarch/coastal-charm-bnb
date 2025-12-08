-- Fix properties RLS policies - the issue is policies referencing auth.users table
-- Drop all existing problematic policies first
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;
DROP POLICY IF EXISTS "Property owners can manage their own properties" ON properties;  
DROP POLICY IF EXISTS "admin_manage_all_properties" ON properties;
DROP POLICY IF EXISTS "Public can view available properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view all properties" ON properties;

-- Create simple, non-conflicting property access policies
CREATE POLICY "Anyone can view properties" 
ON properties FOR SELECT 
USING (true);

CREATE POLICY "Property owners manage properties" 
ON properties FOR ALL 
USING (owner_id = (auth.uid())::text)
WITH CHECK (owner_id = (auth.uid())::text);

CREATE POLICY "Admins manage all properties" 
ON properties FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Fix the specific RLS issue by ensuring profiles table has proper access
-- Drop existing conflicting profile policies first
DROP POLICY IF EXISTS "Public can view active profiles" ON profiles;

-- Create new profile access policy
CREATE POLICY "Public can view active profiles" 
ON profiles FOR SELECT 
USING (status = 'active');

-- Ensure vendor profiles are accessible for vendor functionality  
-- Drop existing conflicting vendor profile policies first
DROP POLICY IF EXISTS "Anyone can view vendor profiles" ON vendor_profiles;

-- Create new vendor profile access policy
CREATE POLICY "Anyone can view vendor profiles" 
ON vendor_profiles FOR SELECT 
USING (true);