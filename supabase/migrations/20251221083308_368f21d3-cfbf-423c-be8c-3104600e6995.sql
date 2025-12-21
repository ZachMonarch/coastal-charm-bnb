-- Phase 2: Populate HVAC RFQ Data
-- Update HVAC RFQ to link to property
UPDATE public.rfqs SET property_id = 1 WHERE id = 'ed3959f4-5226-4304-b329-a806ada3f430';

-- Insert RFQ Lots for HVAC project
INSERT INTO public.rfq_lots (rfq_id, lot_name, quantity, unit_of_measure, specifications) VALUES
('ed3959f4-5226-4304-b329-a806ada3f430', 'HVAC Equipment & Materials', 1, 'lot', 
  '{"description": "Central heating and cooling equipment including condensing units, air handlers, ductwork, and controls", "includes": ["Condensing units", "Air handlers", "Ductwork", "Thermostats", "Controls"], "notes": "Must meet ENERGY STAR requirements"}'::jsonb),
('ed3959f4-5226-4304-b329-a806ada3f430', 'Labor & Installation Services', 240, 'hours',
  '{"description": "Professional installation by certified HVAC technicians", "includes": ["Equipment installation", "Ductwork fabrication", "Electrical connections", "System testing"], "certifications_required": ["EPA 608", "NATE"]}'::jsonb),
('ed3959f4-5226-4304-b329-a806ada3f430', 'Engineering & Design', 1, 'lot',
  '{"description": "Load calculations, system design, and permit drawings", "includes": ["Manual J calculations", "System design", "Permit drawings", "Equipment specifications"], "deliverables": ["Design documents", "Permit package"]}'::jsonb),
('ed3959f4-5226-4304-b329-a806ada3f430', 'Maintenance & Warranty Program', 2, 'years',
  '{"description": "Comprehensive maintenance and warranty coverage", "includes": ["Quarterly inspections", "Filter replacement", "Parts warranty", "Labor warranty"], "response_time": "24 hours for emergencies"}'::jsonb),
('ed3959f4-5226-4304-b329-a806ada3f430', 'Contingency & Miscellaneous', 1, 'lot',
  '{"description": "Allowance for unforeseen conditions and additional work", "percentage": "10%", "includes": ["Additional materials", "Change orders", "Site conditions"]}'::jsonb)
ON CONFLICT DO NOTHING;

-- Invite verified vendors to HVAC RFQ
-- Get admin user ID first for invited_by field
INSERT INTO public.rfq_invites (rfq_id, vendor_id, invited_by, status) 
SELECT 
  'ed3959f4-5226-4304-b329-a806ada3f430'::uuid,
  vp.user_id,
  (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1),
  'invited'
FROM public.vendor_profiles vp
WHERE vp.is_verified = true
ON CONFLICT DO NOTHING;