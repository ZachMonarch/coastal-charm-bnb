-- Create RLS policies for properties table
-- Enable public read access for browsing properties
CREATE POLICY "Allow public read access to properties"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow property owners to manage their own properties
CREATE POLICY "Property owners can manage their own properties"
ON public.properties
FOR ALL
TO authenticated
USING (auth.uid()::text = owner_id)
WITH CHECK (auth.uid()::text = owner_id);

-- Allow admins to manage all properties
CREATE POLICY "Admins can manage all properties"
ON public.properties
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms ON properties(bathrooms);