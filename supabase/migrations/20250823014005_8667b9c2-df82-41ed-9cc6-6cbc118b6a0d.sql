-- Add RLS policies for tables that need them

-- Bookings table policies
CREATE POLICY "Users can view their own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON bookings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings" 
ON bookings FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Property inquiries policies
CREATE POLICY "Anyone can create inquiries" 
ON property_inquiries FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries" 
ON property_inquiries FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Property owners can view inquiries for their properties" 
ON property_inquiries FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_inquiries.property_id 
  AND properties.owner_id = auth.uid()::text
));

-- Transactions policies
CREATE POLICY "Users can view their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" 
ON transactions FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Vendor applications policies
CREATE POLICY "Users can view their own applications" 
ON vendor_applications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON vendor_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications" 
ON vendor_applications FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Vendor bids policies
CREATE POLICY "Vendors can view their own bids" 
ON vendor_bids FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create their own bids" 
ON vendor_bids FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all bids" 
ON vendor_bids FOR ALL 
USING (has_role(auth.uid(), 'admin'));