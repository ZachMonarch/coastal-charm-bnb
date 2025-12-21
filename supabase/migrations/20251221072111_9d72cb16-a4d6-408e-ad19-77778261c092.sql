-- Add document records linking PDFs to The Broadwin RFQ project
-- First, get the RFQ ID for The Broadwin Condominium HVAC Project
DO $$
DECLARE
  broadwin_rfq_id UUID;
BEGIN
  -- Get the RFQ ID
  SELECT id INTO broadwin_rfq_id 
  FROM public.rfqs 
  WHERE title ILIKE '%Broadwin%HVAC%' 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Only proceed if we found the RFQ
  IF broadwin_rfq_id IS NOT NULL THEN
    -- Insert document records (these reference files that should be uploaded to storage)
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
      broadwin_rfq_id,
      'Rendered_Units_Plans_A-E_1BR_2BR_3BR_layouts_dimensions_furniture.pdf',
      'broadwin-hvac/Rendered_Units_Plans_A-E_1BR_2BR_3BR_layouts_dimensions_furniture.pdf',
      2500000,
      'application/pdf',
      'floor_plan',
      'Unit Layouts',
      true
    ),
    (
      broadwin_rfq_id,
      'Units_Floor_Plan_package_Ground_Typical_Top_Broadwin.pdf',
      'broadwin-hvac/Units_Floor_Plan_package_Ground_Typical_Top_Broadwin.pdf',
      3200000,
      'application/pdf',
      'floor_plan',
      'Floor Plans',
      true
    ),
    (
      broadwin_rfq_id,
      '18019_Prelim-Ground_Floor.pdf',
      'broadwin-hvac/18019_Prelim-Ground_Floor.pdf',
      1800000,
      'application/pdf',
      'blueprint',
      'Ground Floor',
      true
    ),
    (
      broadwin_rfq_id,
      '18019_Prelim-Upper_Floors.pdf',
      'broadwin-hvac/18019_Prelim-Upper_Floors.pdf',
      2100000,
      'application/pdf',
      'blueprint',
      'Upper Floors',
      true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Successfully added 4 document records to RFQ %', broadwin_rfq_id;
  ELSE
    RAISE NOTICE 'Broadwin RFQ not found - documents not added';
  END IF;
END $$;