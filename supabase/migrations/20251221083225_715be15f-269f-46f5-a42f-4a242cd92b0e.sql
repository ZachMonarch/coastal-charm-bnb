-- Phase 1: Fix missing app.current_tenant() function
-- Create the missing function that RLS policies depend on
CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION app.current_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION app.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION app.user_id() TO authenticated;

-- Ensure the admin fallback policy exists and works
DROP POLICY IF EXISTS rfqs_admin_access ON public.rfqs;
CREATE POLICY rfqs_admin_access ON public.rfqs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for vendor RFQ access (invites)
DROP POLICY IF EXISTS rfqs_vendor_invited ON public.rfqs;
CREATE POLICY rfqs_vendor_invited ON public.rfqs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_invites 
      WHERE rfq_id = rfqs.id AND vendor_id = auth.uid()
    )
  );

-- Add RFQ lots policy for vendors to view
DROP POLICY IF EXISTS rfq_lots_vendor_view ON public.rfq_lots;
CREATE POLICY rfq_lots_vendor_view ON public.rfq_lots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfq_invites ri
      WHERE ri.rfq_id = rfq_lots.rfq_id AND ri.vendor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add RFQ invites policy for vendors
DROP POLICY IF EXISTS rfq_invites_vendor_view ON public.rfq_invites;
CREATE POLICY rfq_invites_vendor_view ON public.rfq_invites
  FOR SELECT
  USING (
    vendor_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );