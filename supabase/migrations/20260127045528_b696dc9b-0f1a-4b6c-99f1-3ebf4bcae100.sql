-- Insert the Painting RFQ based on the PAINT_RFQ_DOC_ROUGH.docx content
-- Using the same structure as the existing HVAC RFQ

-- First, insert the main RFQ record
INSERT INTO rfqs (
  title,
  description,
  category,
  deadline,
  expected_duration,
  status,
  property_id,
  tenant_id,
  created_by,
  document_control,
  executive_summary,
  building_details,
  system_strategy,
  unit_configuration,
  commercial_framework,
  codes_compliance,
  staffing_requirements,
  budget_guidance
) VALUES (
  'Painting Services — The Broadwin Condominium (MPM/26-PAINT)',
  'Monarch Property Management seeks qualified painting contractors to provide comprehensive interior painting services for The Broadwin Condominium in Columbus, OH. Scope includes initial wall painting of all 42 residential units, controlled surface preparation (25% max prep cap per unit), recurring maintenance touch-ups, and emergency painting-related response services. Paint for initial service is Owner-Furnished.',
  'painting',
  '2026-04-30 23:59:59+00',
  '6-10 weeks initial; 12-month recurring term',
  'open',
  2205,
  '00000000-0000-0000-0000-000000000001',
  '57f850b4-d457-450f-bdf1-7bd7e35c93d5',
  -- document_control
  '{"rfq_reference": "MPM/26-PAINT", "document_title": "Painting Technical, BOQ, Scope of Work & Commercial Framework – Master Information Package", "project_name": "The Broadwin Condominium", "project_address": "1312 East Broad Street, Columbus, OH 43203", "issuer": "Monarch Property Management", "issue_date": "2026-01-27", "document_status": "Issued for Quotation (IFQ) – Scope, quantities, and execution logic are final", "issue_purpose": "Vendor understanding, technical clarity, BOQ confirmation, and risk elimination prior to pricing submission", "website": "www.monarchpropertymmgt.com", "project_email": "projects@monarchpropertymmgt.com"}'::jsonb,
  -- executive_summary
  '{"project_summary": "The Broadwin Condominium is a multi-story residential building consisting of 42 residential units (27×1BR, 9×2BR, 6×3BR), interior common areas (lobby, corridors, stairwells, laundry rooms), service and mechanical spaces, and parking structure.", "services_required": ["Initial interior wall painting of all units and selective common areas", "Controlled minor surface preparation (patching, sanding, caulking)", "Recurring maintenance touch-ups", "Emergency painting-related response services"], "material_note": "Paint for the initial service is Owner-Furnished, unless otherwise specified.", "design_intent": ["Achieve uniform, durable interior finishes", "Minimize future maintenance", "Enforce strict scope and cost controls", "Maintain controlled surface prep limits: 25% max billable area per unit"], "expected_duration": "Initial Major Service: 6–10 weeks; Recurring Services: 12-month term (renewable); Emergency Services: On-call", "residential_units": 42, "total_area": "75,771 SF (gross)", "floors": 8}'::jsonb,
  -- building_details
  '{"building_type": "Multi-Family Residential (Condominium / Apartment)", "floors": "Multi-story (8 floors)", "total_area": "75,771 SF (gross)", "residential_units": 42, "unit_mix": "27×1BR, 9×2BR, 6×3BR", "common_areas": "Lobby, corridors, stairwells, laundry rooms", "parking": "31 spaces (1 van-accessible)", "fire_protection": "NFPA 13R sprinkler system"}'::jsonb,
  -- system_strategy (painting strategy)
  '{"system_type": "Interior Painting Services", "painting_type": ["Interior walls and ceilings (2 coats walls, 1–2 coats ceilings)", "Doors, trims, and frames", "Approved exterior wall and trim painting", "Minor surface preparation within controlled limits"], "prohibited_scope": ["No drywall replacement", "No structural patching", "No waterproofing coatings", "No decorative finishes outside issued BOQ", "No moisture/mold remediation", "No stain bleed-through or fire/smoke remediation"], "design_finality": ["Scope, unit quantities, and BOQ are authoritative", "Vendors must price per issued specifications", "No alternative interpretation without written approval"]}'::jsonb,
  -- unit_configuration
  '[{"unit_type": "1-Bedroom", "quantity": 27, "typical_size": "650–750 SF", "wall_area_sf": 66150, "max_prep_area_sf": 16538, "notes": "Controlled patch/sand/caulk only"}, {"unit_type": "2-Bedroom", "quantity": 9, "typical_size": "900–1,050 SF", "wall_area_sf": 26213, "max_prep_area_sf": 6553, "notes": "Minor prep only"}, {"unit_type": "3-Bedroom", "quantity": 6, "typical_size": "1,200–1,350 SF", "wall_area_sf": 19950, "max_prep_area_sf": 4987, "notes": "Minor prep only"}]'::jsonb,
  -- commercial_framework
  '{"installation_milestones": [{"milestone": 1, "payment_percent": "70%", "condition": "Upon contract signing & submittal approval (mobilization)"}, {"milestone": 2, "payment_percent": "30%", "condition": "Upon substantial completion & final acceptance"}], "recurring_payment": [{"service_type": "Recurring Maintenance", "payment_terms": "Net 30 days post-verification"}, {"service_type": "Emergency Services", "payment_terms": "Per-call invoicing, Net 15 days"}], "prep_controls": ["Prep beyond limits requires written approval", "Prep is non-transferable between unit types", "Unused prep is not billable", "All prep priced per SF"]}'::jsonb,
  -- codes_compliance
  '{"requirements": ["OSHA safety standards", "EPA lead-safe practices", "Local Columbus building codes", "Fire protection integrity maintained", "Low-VOC paints required in all occupied areas"]}'::jsonb,
  -- staffing_requirements
  '{"recommended_crew_size": "6–12 personnel", "required_qualifications": ["Licensed painting contractor", "OSHA compliance", "Trained surface prep personnel", "Site supervisor dedicated to quality control"], "suggested_staffing": ["1–2 Supervisors", "4–8 Skilled Painters", "2–3 Helpers"]}'::jsonb,
  -- budget_guidance
  '{"items": [{"service": "Initial Painting Service", "budget_min": "$150,000", "budget_max": "$280,000"}, {"service": "Recurring Maintenance – Monthly", "budget_min": "$30,000", "budget_max": "$150,000"}, {"service": "Recurring Maintenance – Quarterly", "budget_min": "$50,000", "budget_max": "$180,000"}, {"service": "Recurring Maintenance – Annual", "budget_min": "$50,000", "budget_max": "$250,000"}, {"service": "Emergency Services", "budget_min": "$20,000", "budget_max": "$100,000"}, {"service": "Contingency", "budget_min": "7%", "budget_max": "10%"}], "notes": ["Budget guidance is non-binding", "Vendors should price based on BOQ and site conditions", "Contingency is optional per vendor discretion"], "total_estimate": "$150,000 – $280,000 (initial service only)", "technical_summary": {"residential_units_paintable_area": "112,313 SF walls + ceilings", "controlled_prep_area_max_billable": "28,078 SF", "doors_and_trim": "43 units, 308 doors (est.)", "common_areas": "approx. 36,000 SF"}}'::jsonb
);

-- Insert the RFQ lots for the Painting RFQ
-- Note: We need to get the ID of the just-inserted RFQ
WITH new_rfq AS (
  SELECT id FROM rfqs WHERE title = 'Painting Services — The Broadwin Condominium (MPM/26-PAINT)' LIMIT 1
)
INSERT INTO rfq_lots (rfq_id, lot_name, quantity, unit_of_measure, specifications) VALUES
  ((SELECT id FROM new_rfq), 'Painting Materials & Consumables', 1, 'Lot', '{"description": "All painting materials, consumables, brushes, rollers, drop cloths, tape, and related supplies. Note: Interior wall paint is Owner-Furnished.", "includes": ["Primers and sealers", "Trim and door paint", "Exterior paint (if applicable)", "Consumables and protection materials"]}'::jsonb),
  ((SELECT id FROM new_rfq), 'Labor & Installation Services', 1, 'Lot', '{"description": "Complete labor for painting services including wall painting, ceiling painting, trim work, door painting, and cleanup.", "scope": ["2 coats on all interior walls", "1-2 coats on ceilings", "All doors (both sides and edges)", "Trim and baseboards", "Cut-ins at corners and openings"]}'::jsonb),
  ((SELECT id FROM new_rfq), 'Surface Preparation', 1, 'Lot', '{"description": "Controlled surface preparation including patching, sanding, caulking within 25% prep cap per unit.", "max_billable_area": "28,078 SF total", "controls": ["25% max prep cap per unit type", "Non-transferable between unit types", "Unused prep not billable", "Written approval required for excess"]}'::jsonb),
  ((SELECT id FROM new_rfq), 'Maintenance Program (12 months)', 1, 'Lot', '{"description": "Recurring maintenance and touch-up program for 12-month term (renewable).", "options": ["Monthly maintenance plan", "Quarterly maintenance plan", "Annual maintenance plan"], "payment_terms": "Net 30 days post-verification"}'::jsonb),
  ((SELECT id FROM new_rfq), 'Emergency Response Allowance', 1, 'Lot', '{"description": "On-call emergency painting response services including water damage touch-ups, urgent repairs, and priority scheduling.", "payment_terms": "Per-call invoicing, Net 15 days", "scope": ["24-48 hour response time", "Emergency touch-ups", "Water damage repair painting"]}'::jsonb);