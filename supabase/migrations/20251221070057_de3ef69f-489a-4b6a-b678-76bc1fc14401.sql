-- Seed The Broadwin Condominium HVAC Project
INSERT INTO rfqs (
  id,
  title,
  description,
  deadline,
  status,
  category,
  expected_duration,
  tenant_id,
  created_by,
  document_control,
  executive_summary,
  building_details,
  system_strategy,
  unit_configuration,
  technical_specs,
  commercial_framework,
  codes_compliance,
  staffing_requirements,
  budget_guidance
) VALUES (
  gen_random_uuid(),
  'HVAC Technical, BOQ, Scope of Work & Commercial Framework',
  'The Broadwin Condominium – 1312 East Broad Street, Columbus, OH 43205. Complete HVAC system design, installation, and maintenance for an 8-story residential building with 42 units.',
  '2025-03-31T23:59:59Z',
  'open',
  'HVAC',
  '8-12 months',
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  -- Document Control
  '{
    "rfq_reference": "MPM-HVAC-2025-01",
    "document_title": "HVAC Master Information Package",
    "project_name": "The Broadwin Condominium",
    "project_address": "1312 East Broad Street, Columbus, OH 43205",
    "issue_date": "2025-01-15",
    "revision": "Rev A",
    "status": "ISSUED FOR BID",
    "prepared_by": "Monarch Property Management",
    "contact_email": "projects@monarchpropertymmgt.online",
    "contact_phone": "+1 (614) 555-0100"
  }'::jsonb,
  -- Executive Summary
  '{
    "building_overview": "The Broadwin Condominium is an 8-story residential building comprising 42 individually-owned condominium units located in Columbus, Ohio. The building was originally constructed in 1985 and requires a comprehensive HVAC system upgrade to meet current energy efficiency standards and resident comfort expectations.",
    "project_scope": "This Request for Quotation covers the complete design, procurement, installation, commissioning, and warranty support for individual split-system HVAC units in all 42 residential units, plus common area climate control systems.",
    "design_intent": "The HVAC system shall provide year-round comfort with individual zone control for each unit, energy-efficient operation meeting ENERGY STAR requirements, quiet operation suitable for residential environments, and easy maintenance access for property management.",
    "key_objectives": [
      "Provide reliable heating and cooling for all 42 units",
      "Minimize energy consumption through high-efficiency equipment",
      "Ensure quiet operation (NC-35 or better in occupied spaces)",
      "Enable individual temperature control for each unit",
      "Facilitate easy maintenance and filter replacement"
    ],
    "timeline_overview": "Installation to be completed in phases over 8-12 months, with minimal disruption to residents"
  }'::jsonb,
  -- Building Details
  '{
    "building_name": "The Broadwin Condominium",
    "address": "1312 East Broad Street, Columbus, OH 43205",
    "building_type": "Residential Condominium",
    "year_built": 1985,
    "total_floors": 8,
    "floor_breakdown": {
      "ground_floor": "Lobby, mail room, mechanical room, storage",
      "floors_2_7": "Residential units (7 units per floor)",
      "floor_8": "Residential units (7 units) + rooftop mechanical"
    },
    "total_units": 42,
    "total_gross_area_sqft": 85000,
    "typical_floor_area_sqft": 10500,
    "parking": {
      "type": "Underground garage",
      "spaces": 60,
      "ventilation_required": true
    },
    "structural_notes": "Concrete frame construction with masonry exterior walls. Ceiling heights: 9ft in living areas, 8ft in bedrooms.",
    "electrical_service": "480V/277V 3-phase main, 208V/120V for residential units",
    "existing_hvac": "Original 1985 window units and baseboard heating - to be completely replaced"
  }'::jsonb,
  -- System Strategy
  '{
    "system_type": "Individual Split-System Heat Pumps",
    "system_description": "Each residential unit shall receive a dedicated ductless mini-split heat pump system with one outdoor condensing unit and one to three indoor air handlers depending on unit size.",
    "design_philosophy": "Individual systems provide unit-by-unit control, simplified maintenance, and avoid the complexity of centralized systems in a condominium environment where each unit is separately owned.",
    "prohibited_systems": [
      "Window AC units",
      "Portable AC units",
      "Electric baseboard heating (except as backup)",
      "Gas-fired equipment in living spaces"
    ],
    "energy_requirements": {
      "minimum_seer": 18,
      "minimum_hspf": 10,
      "energy_star_required": true
    },
    "noise_requirements": {
      "indoor_unit_max_db": 26,
      "outdoor_unit_max_db": 55,
      "nc_rating": "NC-35 or better"
    },
    "finality_statement": "System design is at 100% Development stage. Minor field adjustments may be required during installation, but the overall approach and equipment specifications are final."
  }'::jsonb,
  -- Unit Configuration
  '[
    {"unit_type": "Type A - 1BR", "count": 14, "area_sqft": 650, "hvac_zones": 1, "cooling_tons": 1.0, "heating_btu": 12000, "air_handlers": 1},
    {"unit_type": "Type B - 1BR+Den", "count": 10, "area_sqft": 800, "hvac_zones": 2, "cooling_tons": 1.5, "heating_btu": 18000, "air_handlers": 2},
    {"unit_type": "Type C - 2BR", "count": 12, "area_sqft": 1000, "hvac_zones": 2, "cooling_tons": 2.0, "heating_btu": 24000, "air_handlers": 2},
    {"unit_type": "Type D - 2BR+Den", "count": 4, "area_sqft": 1200, "hvac_zones": 3, "cooling_tons": 2.5, "heating_btu": 30000, "air_handlers": 3},
    {"unit_type": "Type E - 3BR", "count": 2, "area_sqft": 1500, "hvac_zones": 3, "cooling_tons": 3.0, "heating_btu": 36000, "air_handlers": 3}
  ]'::jsonb,
  -- Technical Specs
  '{
    "load_summary": {
      "total_cooling_tons": 72,
      "total_heating_mbtuh": 864,
      "peak_electrical_kw": 215,
      "design_outdoor_temp_summer": 92,
      "design_outdoor_temp_winter": 5,
      "design_indoor_temp_cooling": 75,
      "design_indoor_temp_heating": 70
    },
    "equipment_specifications": {
      "outdoor_units": {
        "description": "Variable-speed inverter-driven heat pump condensing units",
        "mounting": "Rooftop for floors 5-8, ground level mechanical yard for floors 1-4",
        "refrigerant": "R-410A or approved low-GWP alternative"
      },
      "indoor_units": {
        "type": "Wall-mounted ductless air handlers",
        "features": ["Washable filters", "Wireless remote", "Wi-Fi capability", "Auto-swing louvers"]
      }
    },
    "bill_of_quantities": [
      {"item": "1-ton outdoor units", "quantity": 14, "unit": "EA"},
      {"item": "1.5-ton outdoor units", "quantity": 10, "unit": "EA"},
      {"item": "2-ton outdoor units", "quantity": 12, "unit": "EA"},
      {"item": "2.5-ton outdoor units", "quantity": 4, "unit": "EA"},
      {"item": "3-ton outdoor units", "quantity": 2, "unit": "EA"},
      {"item": "Wall-mounted indoor units (9,000 BTU)", "quantity": 14, "unit": "EA"},
      {"item": "Wall-mounted indoor units (12,000 BTU)", "quantity": 48, "unit": "EA"},
      {"item": "Wall-mounted indoor units (18,000 BTU)", "quantity": 18, "unit": "EA"},
      {"item": "Refrigerant line sets (various lengths)", "quantity": 80, "unit": "SET"},
      {"item": "Condensate pumps", "quantity": 80, "unit": "EA"},
      {"item": "Electrical disconnects", "quantity": 42, "unit": "EA"},
      {"item": "Wireless thermostats", "quantity": 80, "unit": "EA"}
    ],
    "installation_standards": [
      "ASHRAE 90.1 Energy Standard",
      "ACCA Manual J for load calculations",
      "ACCA Manual D for duct sizing (if applicable)",
      "SMACNA standards for sheet metal work",
      "NFPA 90A for air conditioning installations"
    ]
  }'::jsonb,
  -- Commercial Framework
  '{
    "payment_milestones": [
      {"milestone": "Contract Award & Mobilization", "percentage": 10, "description": "Upon contract execution and site mobilization"},
      {"milestone": "Equipment Procurement", "percentage": 25, "description": "Upon verified delivery of major equipment to site"},
      {"milestone": "50% Installation Complete", "percentage": 25, "description": "Upon completion of 21 unit installations"},
      {"milestone": "100% Installation Complete", "percentage": 25, "description": "Upon completion of all 42 unit installations"},
      {"milestone": "Commissioning & Handover", "percentage": 10, "description": "Upon successful commissioning and owner acceptance"},
      {"milestone": "Warranty Retention", "percentage": 5, "description": "Released 12 months after final handover"}
    ],
    "maintenance_terms": {
      "warranty_period_years": 2,
      "extended_maintenance_available": true,
      "response_time_emergency": "4 hours",
      "response_time_routine": "24-48 hours",
      "preventive_maintenance_frequency": "Quarterly filter checks, annual comprehensive service"
    },
    "insurance_requirements": {
      "general_liability": "$2,000,000 per occurrence",
      "workers_comp": "Statutory limits",
      "professional_liability": "$1,000,000 per occurrence"
    },
    "bonding": {
      "performance_bond": "100% of contract value",
      "payment_bond": "100% of contract value"
    }
  }'::jsonb,
  -- Codes & Compliance
  '[
    {"code": "ASHRAE 90.1-2019", "description": "Energy Standard for Buildings", "requirement": "Full compliance required"},
    {"code": "ASHRAE 62.1-2019", "description": "Ventilation for Acceptable Indoor Air Quality", "requirement": "Minimum ventilation rates per occupancy"},
    {"code": "International Mechanical Code (IMC) 2021", "description": "Mechanical system installation", "requirement": "Ohio amendments apply"},
    {"code": "NFPA 90A", "description": "Air Conditioning and Ventilation Systems", "requirement": "Fire/smoke damper requirements"},
    {"code": "NFPA 70 (NEC) 2020", "description": "National Electrical Code", "requirement": "All electrical work"},
    {"code": "EPA Section 608", "description": "Refrigerant handling certification", "requirement": "All technicians must be certified"},
    {"code": "Ohio Building Code", "description": "State building requirements", "requirement": "Permits required for all work"},
    {"code": "ADA Accessibility", "description": "Accessible design requirements", "requirement": "Common area thermostat heights"}
  ]'::jsonb,
  -- Staffing Requirements
  '{
    "minimum_crew_size": 8,
    "required_certifications": [
      "EPA 608 Universal Certification",
      "OSHA 30-Hour Construction Safety",
      "Ohio Mechanical Contractor License",
      "Manufacturer-specific training (brand selected)"
    ],
    "key_personnel": [
      {"role": "Project Manager", "requirements": "10+ years HVAC experience, PMP preferred"},
      {"role": "Site Supervisor", "requirements": "5+ years multi-family HVAC experience"},
      {"role": "Lead Installer", "requirements": "Journeyman level, 5+ years experience"},
      {"role": "Commissioning Technician", "requirements": "NEBB or equivalent certification"}
    ],
    "background_checks": true,
    "drug_testing": true,
    "uniform_requirements": "Company-branded uniforms with visible ID badges"
  }'::jsonb,
  -- Budget Guidance
  '{
    "estimated_installation_range": {
      "low": 750000,
      "high": 950000,
      "currency": "USD"
    },
    "estimated_annual_maintenance": {
      "low": 35000,
      "high": 50000,
      "currency": "USD"
    },
    "budget_notes": "Estimates are for budgeting purposes only. Final pricing will be based on submitted bids. Pricing should include all labor, materials, equipment, permits, and warranty support.",
    "excluded_from_scope": [
      "Electrical panel upgrades (if required)",
      "Structural modifications",
      "Asbestos abatement (if encountered)",
      "Finish patching and painting (by others)"
    ],
    "allowances": [
      {"item": "Permit fees", "amount": 15000},
      {"item": "Testing and balancing", "amount": 8000}
    ]
  }'::jsonb
) ON CONFLICT DO NOTHING;