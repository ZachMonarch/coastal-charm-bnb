-- Add remaining RLS policies for tables missing them

-- Property inquiries policies (already has admin and property owner)
CREATE POLICY "Property managers can view all inquiries"
ON public.property_inquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'property_manager'
  )
);

-- Transactions policies (users can already view their own)
CREATE POLICY "Property managers can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'property_manager')
  )
);

-- Notifications policies (users can already manage their own)
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);