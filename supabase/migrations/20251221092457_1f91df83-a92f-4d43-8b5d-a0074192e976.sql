-- PHASE 2-3: Create Broadwin Property and Update HVAC RFQ with full content

-- First, create The Broadwin Condominium property
INSERT INTO public.properties (
  title,
  address,
  city,
  state,
  zip_code,
  property_type,
  description,
  bedrooms,
  bathrooms,
  square_feet,
  status
) VALUES (
  'The Broadwin Condominium',
  '1312 East Broad Street',
  'Columbus',
  'OH',
  43203,
  'Residential Condominium',
  '8-story residential condominium building with 42 residential units, common areas (lobby, corridors, stairwells, laundry rooms), mechanical rooms, and 31 parking spaces.',
  42,
  42,
  '52348',
  'active'
) ON CONFLICT DO NOTHING
RETURNING id;

-- Update the existing HVAC RFQ with the new property and full content
UPDATE public.rfqs
SET 
  property_id = (SELECT id FROM properties WHERE title = 'The Broadwin Condominium' ORDER BY id DESC LIMIT 1),
  category = 'HVAC',
  description = 'Monarch Property Management seeks qualified HVAC contractors to provide turnkey HVAC system installation, full commissioning and balancing, mandatory preventive maintenance pricing, and emergency service capability for The Broadwin Condominium in Columbus, OH.',
  expected_duration = '8-12 months from Notice to Proceed (NTP)',
  document_control = '{
    "rfq_reference": "MPM-HVAC-2025-01",
    "document_title": "HVAC Technical, BOQ, Scope of Work & Commercial Framework – Master Information Package",
    "project_name": "The Broadwin Condominium",
    "project_address": "1312 East Broad Street, Columbus, OH 43203",
    "issuer": "Monarch Property Management",
    "website": "www.monarchpropertymmgt.com",
    "project_email": "projects@monarchpropertymmgt.com",
    "support_email": "support@monarchpropertymmgt.com",
    "issue_purpose": "Vendor understanding, technical clarity, scope confirmation, and risk elimination prior to pricing submission.",
    "document_status": "Issued for Quotation (IFQ) – Design, quantities, and system strategy are final."
  }'::jsonb,
  executive_summary = '{
    "project_summary": "The Broadwin is an 8-story residential condominium building with 42 residential units, common areas (lobby, corridors, stairwells, laundry rooms), mechanical rooms, and 31 parking spaces (1 van-accessible). Monarch Property Management seeks qualified HVAC contractors to provide turnkey HVAC system installation, full commissioning and balancing, mandatory preventive maintenance pricing, and emergency service capability.",
    "design_intent": "The project is structured for low ambiguity, minimal redesign risk, and rapid execution, enabling vendors to price confidently without walkthrough dependency. Walkthroughs are only requested after preliminary pricing review.",
    "expected_duration": "8–12 months from Notice to Proceed (NTP)",
    "building_type": "Residential Condominium",
    "floors": 8,
    "total_area": "~52,348 SF",
    "residential_units": 42,
    "common_areas": "Lobby, corridors, stairwells, laundry rooms, mechanical rooms",
    "parking": "31 spaces (1 van-accessible)",
    "fire_protection": "Full NFPA 13R sprinkler system"
  }'::jsonb,
  building_details = '{
    "building_type": "Residential Condominium",
    "floors": 8,
    "total_area": "~52,348 SF",
    "residential_units": 42,
    "common_areas": "Lobby, corridors, stairwells, laundry rooms, mechanical rooms",
    "parking": "31 spaces (1 van-accessible)",
    "fire_protection": "Full NFPA 13R sprinkler system"
  }'::jsonb,
  system_strategy = '{
    "system_type": "Dedicated Split HVAC Systems for each residential unit",
    "prohibited_systems": ["No VRF systems", "No shared refrigerant loops", "No centralized chilled water", "No hydronic heating"],
    "rationale": "Each unit is served independently to ensure tenant independence, simplified maintenance, reduced operational risk, faster repair and replacement, and accurate utility allocation.",
    "design_finality": ["HVAC design basis, system configuration, and quantities are final and authoritative", "Vendors must execute the scope as defined", "No re-engineering, resizing, or alternative logic is allowed without written approval", "All pricing must strictly follow this document set"]
  }'::jsonb,
  unit_configuration = '[
    {"unit_type": "1-Bedroom", "quantity": 27, "typical_size": "650–750 SF", "hvac_capacity": "1.5 tons"},
    {"unit_type": "2-Bedroom", "quantity": 9, "typical_size": "850–1,000 SF", "hvac_capacity": "1.75–2.0 tons"},
    {"unit_type": "3-Bedroom", "quantity": 6, "typical_size": "1,150–1,300 SF", "hvac_capacity": "2.0 tons"}
  ]'::jsonb,
  technical_specs = '{
    "load_basis": [
      {"unit_type": "1-Bedroom", "capacity": "1.5 tons"},
      {"unit_type": "2-Bedroom", "capacity": "1.75–2.0 tons"},
      {"unit_type": "3-Bedroom", "capacity": "2.0 tons"}
    ],
    "cooling_load_summary": {
      "residential": "~75 tons",
      "common_area": "~20 tons",
      "total": "~95 tons"
    },
    "boq": {
      "residential_systems": [
        {"item": "Outdoor Condensing Units", "quantity": "42–43", "unit": "EA"},
        {"item": "Indoor Fan Coil Units", "quantity": "42–60", "unit": "EA"},
        {"item": "Wi-Fi Thermostats", "quantity": "43", "unit": "EA"}
      ],
      "common_area_systems": [
        {"item": "RTU / AHU (~10 tons)", "quantity": "2", "unit": "EA"},
        {"item": "Exhaust Fans", "quantity": "12", "unit": "EA"}
      ],
      "mechanical_distribution": [
        {"item": "Refrigerant Piping", "quantity": "~1,000", "unit": "LF", "notes": "Copper, insulated"},
        {"item": "Ductwork", "quantity": "~4,500", "unit": "SF", "notes": "Galvanized steel"},
        {"item": "Pipe Insulation", "quantity": "Included", "unit": "–", "notes": "Closed-cell"}
      ],
      "controls_commissioning": [
        {"item": "TAB Report", "quantity": "1", "unit": "LS"},
        {"item": "Commissioning Report", "quantity": "1", "unit": "LS"},
        {"item": "As-Built Drawings", "quantity": "1", "unit": "LS"}
      ]
    },
    "installation_scope": ["Equipment installation", "Refrigerant piping & insulation", "Condensate drainage (gravity or pump)", "Duct sealing & balancing", "Electrical coordination and breaker verification", "Startup, testing, and commissioning"],
    "ductwork_standards": ["Material: Galvanized steel", "SMACNA sealing standards", "Flex duct ≤ 6 ft per branch", "Duct insulation R-6 minimum"],
    "piping_standards": ["Material: Copper piping", "Closed-cell insulation, 1\" minimum", "UV-resistant jacketing where exposed", "Proper supports, hangers, and labeling"],
    "site_access": ["Standard working hours: 7:00 AM – 5:00 PM, Monday–Friday", "Noise restrictions: High-noise tasks cease by 4:00 PM", "48 hours delivery coordination notice", "Daily cleanup with secured work areas"],
    "controls": [
      {"feature": "Type", "specification": "Wi-Fi programmable thermostats, ENERGY STAR rated"},
      {"feature": "Residential Units", "specification": "One thermostat per unit"},
      {"feature": "Common Areas", "specification": "Controls integrated with RTUs / AHUs"},
      {"feature": "Equipment", "specification": "Factory-approved control boards only"},
      {"feature": "Control Logic", "specification": "Occupancy and setback scheduling; sequence of operations documented in submittals"}
    ],
    "tab_requirements": ["Certified TAB specialist (NEBB / SMACNA)", "Room-by-room airflow verification", "Static pressure verification", "Supply and return balancing", "Final TAB report submission"],
    "commissioning_deliverables": ["Startup reports", "Functional testing results", "Control calibration", "O&M manuals", "Warranty documentation", "Owner training (in-person + recorded video)"]
  }'::jsonb,
  commercial_framework = '{
    "installation_milestones": [
      {"milestone": 1, "payment_percent": "30%", "condition": "Upon contract signing & submittal approval"},
      {"milestone": 2, "payment_percent": "40%", "condition": "Upon equipment delivery and verified inventory"},
      {"milestone": 3, "payment_percent": "30%", "condition": "Upon substantial completion, commissioning, TAB, O&M manuals, as-builts"}
    ],
    "maintenance_payment": [
      {"service_type": "Monthly Maintenance", "payment_terms": "50% upfront, 50% post-verification"},
      {"service_type": "Emergency Services", "payment_terms": "Per-call invoicing, Net 15 days"}
    ]
  }'::jsonb,
  codes_compliance = '["ASHRAE 62.1/90.1", "International Mechanical Code (IMC)", "SMACNA ductwork standards", "NFPA standards", "Local Columbus mechanical codes", "Fire-stopping for all penetrations", "Maintaining sprinkler coverage", "Using approved firestop systems", "Coordination with sprinkler contractor"]'::jsonb,
  staffing_requirements = '{
    "requirements": ["Licensed HVAC technicians", "EPA Section 608 certification", "OSHA compliance", "TAB specialists as required", "Mandatory supervisory oversight"],
    "team_size": "8–15 personnel",
    "suggested_staffing": ["2 HVAC Supervisors", "4–6 Licensed Technicians", "2 TAB Specialists", "2–4 Apprentices/Helpers"]
  }'::jsonb,
  budget_guidance = '{
    "items": [
      {"service": "Total Installation & Setup", "budget_range": "$430,000 – $520,000"},
      {"service": "Recurring Preventive Maintenance (Annual)", "budget_range": "$42,000 – $55,000"},
      {"service": "Emergency Services (Annual)", "budget_range": "$15,000 – $25,000"},
      {"service": "Reserved / Contingency Funds", "budget_range": "$50,000 – $80,000 (10–15% of total)"},
      {"service": "Performance Bonus / Incentives (Optional)", "budget_range": "$15,000 – $25,000 (3–5% of contract)"}
    ],
    "total_estimate": "$552,000 – $685,000",
    "notes": ["Includes contingency for delays, extra labor, material overruns", "Emergency SLA response funds", "Optional performance bonuses to incentivize timely completion and SLA compliance"]
  }'::jsonb,
  updated_at = NOW()
WHERE id = 'ed3959f4-5226-4304-b329-a806ada3f430';