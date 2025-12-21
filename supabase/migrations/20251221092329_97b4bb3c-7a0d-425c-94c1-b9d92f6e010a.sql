-- Drop ALL existing RLS policies on these tables to start fresh
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on rfqs
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rfqs' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rfqs', pol.policyname);
  END LOOP;
  
  -- Drop all policies on rfq_lots
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rfq_lots' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rfq_lots', pol.policyname);
  END LOOP;
  
  -- Drop all policies on rfq_invites
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rfq_invites' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rfq_invites', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;

-- Create clean, non-recursive policies

-- 1. RFQs: Staff full access
CREATE POLICY "rfqs_staff_manage" ON public.rfqs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'property_manager')
  )
);

-- 2. RFQs: Vendor can read their invited RFQs
CREATE POLICY "rfqs_vendor_view" ON public.rfqs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rfq_invites inv
    WHERE inv.rfq_id = id AND inv.vendor_id = auth.uid()
  )
);

-- 3. RFQ Lots: Staff full access
CREATE POLICY "rfq_lots_staff_manage" ON public.rfq_lots
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'property_manager')
  )
);

-- 4. RFQ Lots: Vendor can read lots for their invited RFQs
CREATE POLICY "rfq_lots_vendor_view" ON public.rfq_lots
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rfq_invites inv
    WHERE inv.rfq_id = rfq_lots.rfq_id AND inv.vendor_id = auth.uid()
  )
);

-- 5. RFQ Invites: Staff full access
CREATE POLICY "rfq_invites_staff_manage" ON public.rfq_invites
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'property_manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'property_manager')
  )
);

-- 6. RFQ Invites: Vendor can see their own invites
CREATE POLICY "rfq_invites_vendor_read" ON public.rfq_invites
FOR SELECT TO authenticated
USING (vendor_id = auth.uid());

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(text) TO authenticated;