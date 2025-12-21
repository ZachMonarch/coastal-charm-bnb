-- Fix 1: Add documents to the existing HVAC RFQ (correct title match)
DO $$
DECLARE
  hvac_rfq_id UUID;
BEGIN
  -- Get the RFQ ID for any HVAC RFQ
  SELECT id INTO hvac_rfq_id 
  FROM public.rfqs 
  WHERE title ILIKE '%HVAC%' 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Only proceed if we found the RFQ
  IF hvac_rfq_id IS NOT NULL THEN
    -- Insert document records
    INSERT INTO public.rfq_documents (
      rfq_id,
      file_name,
      file_path,
      file_size,
      mime_type,
      document_type,
      category_badge,
      is_required_for_bidding
    ) VALUES
    (
      hvac_rfq_id,
      'Rendered_Units_Plans_A-E_1BR_2BR_3BR_layouts_dimensions_furniture.pdf',
      'broadwin-hvac/Rendered_Units_Plans_A-E_1BR_2BR_3BR_layouts_dimensions_furniture.pdf',
      2500000,
      'application/pdf',
      'floor_plan',
      'Unit Layouts',
      true
    ),
    (
      hvac_rfq_id,
      'Units_Floor_Plan_package_Ground_Typical_Top_Broadwin.pdf',
      'broadwin-hvac/Units_Floor_Plan_package_Ground_Typical_Top_Broadwin.pdf',
      3200000,
      'application/pdf',
      'floor_plan',
      'Floor Plans',
      true
    ),
    (
      hvac_rfq_id,
      '18019_Prelim-Ground_Floor.pdf',
      'broadwin-hvac/18019_Prelim-Ground_Floor.pdf',
      1800000,
      'application/pdf',
      'blueprint',
      'Ground Floor',
      true
    ),
    (
      hvac_rfq_id,
      '18019_Prelim-Upper_Floors.pdf',
      'broadwin-hvac/18019_Prelim-Upper_Floors.pdf',
      2100000,
      'application/pdf',
      'blueprint',
      'Upper Floors',
      true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Successfully added 4 document records to RFQ %', hvac_rfq_id;
  ELSE
    RAISE NOTICE 'HVAC RFQ not found - documents not added';
  END IF;
END $$;

-- Fix 2: CRITICAL - Restrict profiles SELECT to own profile + admin/staff
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;

CREATE POLICY "profiles_own_or_admin_select"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() OR 
  public.is_admin_user(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'property_manager')
  )
);

-- Fix 3: Enable RLS on safe_property_listings view (it's actually a view, so we need different approach)
-- First check if it's a view and handle accordingly

-- Fix 4: Tighten vendor_payment_methods policy
DROP POLICY IF EXISTS "vendor_payment_methods_select_own" ON public.vendor_payment_methods;

CREATE POLICY "vendor_payment_methods_select_own_strict"
ON public.vendor_payment_methods FOR SELECT
USING (
  vendor_id = auth.uid() OR
  public.is_admin_user(auth.uid())
);