-- Add document management to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachments text[],
ADD COLUMN IF NOT EXISTS requirements_documents text[];

-- Create document management table
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES public.profiles(id),
  is_required_for_bidding boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on project_documents
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for project documents
CREATE POLICY "Admins can manage all project documents" ON public.project_documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Vendors can view project documents they can access" ON public.project_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_documents.project_id 
    AND p.status = 'open'
  )
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'vendor'
    )
  )
);

-- Add vendor verification status
ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_tier text,
ADD COLUMN IF NOT EXISTS verification_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_approved_by uuid REFERENCES public.profiles(id);

-- Update vendor profiles to link verification with subscription
UPDATE public.vendor_profiles 
SET subscription_status = 'none' 
WHERE subscription_status IS NULL;

-- Insert sample projects and RFQs
INSERT INTO public.projects (
  title, description, category, priority, status, budget_min, budget_max, 
  deadline, preferred_start_date, location, created_by, skills_required
) VALUES 
-- HVAC Projects
('Commercial HVAC System Installation', 'Complete HVAC system installation for 200-unit apartment complex including ductwork, units, and controls', 'HVAC', 'high', 'open', 45000, 65000, '2024-03-15', '2024-02-01', 'Downtown District, Unit 1-200', (SELECT id FROM auth.users LIMIT 1), ARRAY['HVAC Installation', 'Commercial Experience', 'Licensed Technician']),
('Emergency HVAC Repair Service Contract', '24/7 emergency HVAC repair and maintenance contract for luxury resort property', 'HVAC', 'critical', 'open', 15000, 25000, '2024-02-28', '2024-01-15', 'Luxury Resort Complex', (SELECT id FROM auth.users LIMIT 1), ARRAY['Emergency Response', '24/7 Availability', 'Resort Experience']),
('Residential HVAC Upgrade', 'HVAC system upgrade for 50 residential units including smart thermostats', 'HVAC', 'medium', 'open', 25000, 35000, '2024-04-01', '2024-02-15', 'Residential Complex A', (SELECT id FROM auth.users LIMIT 1), ARRAY['Residential HVAC', 'Smart Systems', 'Energy Efficiency']),

-- Electrical Projects  
('Electrical Panel Modernization', 'Upgrade electrical panels and wiring for 75 units to meet current safety codes', 'Electrical', 'high', 'open', 30000, 45000, '2024-03-20', '2024-02-10', 'Heritage Apartments', (SELECT id FROM auth.users LIMIT 1), ARRAY['Electrical Upgrades', 'Code Compliance', 'Licensed Electrician']),
('Smart Building Electrical Infrastructure', 'Install smart building electrical infrastructure including IoT sensors and automation', 'Electrical', 'medium', 'open', 55000, 75000, '2024-05-15', '2024-03-01', 'Tech Tower Building', (SELECT id FROM auth.users LIMIT 1), ARRAY['Smart Buildings', 'IoT Installation', 'Automation Systems']),
('Emergency Generator Installation', 'Install and configure backup generators for critical facility operations', 'Electrical', 'critical', 'open', 40000, 60000, '2024-02-15', '2024-01-20', 'Medical Center Campus', (SELECT id FROM auth.users LIMIT 1), ARRAY['Generator Installation', 'Emergency Systems', 'Medical Facility Experience']),

-- Plumbing Projects
('Complete Plumbing Renovation', 'Full plumbing system replacement for historic building including pipes, fixtures, and drainage', 'Plumbing', 'high', 'open', 35000, 50000, '2024-04-30', '2024-03-01', 'Historic Building District', (SELECT id FROM auth.users LIMIT 1), ARRAY['Historic Restoration', 'Complete Plumbing', 'Licensed Plumber']),
('Water Efficiency Upgrade Program', 'Install water-efficient fixtures and smart water management systems across multiple properties', 'Plumbing', 'medium', 'open', 20000, 30000, '2024-03-30', '2024-02-20', 'Green Valley Properties', (SELECT id FROM auth.users LIMIT 1), ARRAY['Water Efficiency', 'Smart Systems', 'Sustainability']),
('Commercial Kitchen Plumbing', 'Industrial plumbing installation for new restaurant including grease traps and specialized systems', 'Plumbing', 'medium', 'open', 25000, 40000, '2024-03-10', '2024-02-05', 'Restaurant District', (SELECT id FROM auth.users LIMIT 1), ARRAY['Commercial Plumbing', 'Restaurant Experience', 'Industrial Systems']),

-- General Maintenance Projects
('Multi-Property Maintenance Contract', 'Annual maintenance contract covering HVAC, electrical, and plumbing for 10 properties', 'Maintenance', 'medium', 'open', 80000, 120000, '2024-12-31', '2024-02-01', 'Multiple Locations', (SELECT id FROM auth.users LIMIT 1), ARRAY['Multi-Trade', 'Contract Management', 'Preventive Maintenance']),
('Facility Deep Cleaning and Sanitization', 'Comprehensive deep cleaning and sanitization service for healthcare facilities', 'Cleaning', 'high', 'open', 15000, 25000, '2024-02-20', '2024-01-25', 'Healthcare Campus', (SELECT id FROM auth.users LIMIT 1), ARRAY['Healthcare Cleaning', 'Sanitization', 'Compliance Standards']),
('Preventive Maintenance Program Setup', 'Establish comprehensive preventive maintenance program with scheduling and tracking systems', 'Maintenance', 'medium', 'open', 30000, 45000, '2024-06-01', '2024-03-15', 'Corporate Campus', (SELECT id FROM auth.users LIMIT 1), ARRAY['Preventive Maintenance', 'Program Management', 'Digital Systems']),

-- Landscaping Projects
('Commercial Landscaping Design and Installation', 'Complete landscaping design and installation for new corporate headquarters', 'Landscaping', 'medium', 'open', 50000, 75000, '2024-05-30', '2024-03-01', 'Corporate Headquarters', (SELECT id FROM auth.users LIMIT 1), ARRAY['Landscape Design', 'Commercial Installation', 'Irrigation Systems']),
('Sustainable Garden Implementation', 'Install sustainable gardens with native plants and water-efficient irrigation systems', 'Landscaping', 'low', 'open', 20000, 35000, '2024-04-15', '2024-03-01', 'Eco-Friendly Complex', (SELECT id FROM auth.users LIMIT 1), ARRAY['Sustainable Landscaping', 'Native Plants', 'Water Conservation']),

-- Renovation Projects
('Historic Building Restoration', 'Complete restoration of historic building facade and interior while preserving historical integrity', 'Renovation', 'high', 'open', 150000, 200000, '2024-08-01', '2024-04-01', 'Historic Downtown', (SELECT id FROM auth.users LIMIT 1), ARRAY['Historic Restoration', 'Preservation', 'Specialized Techniques']),
('Modern Office Space Renovation', 'Convert traditional office space to modern collaborative workspace with tech integration', 'Renovation', 'medium', 'open', 75000, 100000, '2024-05-01', '2024-03-15', 'Business District', (SELECT id FROM auth.users LIMIT 1), ARRAY['Office Renovation', 'Modern Design', 'Technology Integration']),
('Apartment Complex Modernization', 'Modernize 40-unit apartment complex including kitchens, bathrooms, and common areas', 'Renovation', 'medium', 'open', 120000, 160000, '2024-07-15', '2024-04-01', 'Riverside Apartments', (SELECT id FROM auth.users LIMIT 1), ARRAY['Residential Renovation', 'Multi-Unit Experience', 'Modern Upgrades']),

-- Security and Technology Projects  
('Advanced Security System Installation', 'Install comprehensive security system with cameras, access control, and monitoring', 'Security', 'high', 'open', 40000, 60000, '2024-03-01', '2024-02-01', 'Financial District Building', (SELECT id FROM auth.users LIMIT 1), ARRAY['Security Systems', 'Access Control', 'Video Surveillance']),
('Smart Building Automation', 'Implement smart building automation system for energy management and tenant convenience', 'Technology', 'medium', 'open', 80000, 120000, '2024-06-01', '2024-04-01', 'Innovation Center', (SELECT id FROM auth.users LIMIT 1), ARRAY['Building Automation', 'Smart Technology', 'Energy Management']),

-- Specialty Projects
('Roofing and Waterproofing', 'Complete roof replacement and waterproofing system for large commercial building', 'Roofing', 'critical', 'open', 85000, 120000, '2024-04-01', '2024-02-15', 'Commercial Plaza', (SELECT id FROM auth.users LIMIT 1), ARRAY['Commercial Roofing', 'Waterproofing', 'Weather Protection']),
('Fire Safety System Upgrade', 'Upgrade fire safety systems including alarms, sprinklers, and emergency exits', 'Safety', 'critical', 'open', 60000, 85000, '2024-02-28', '2024-01-30', 'High-Rise Building', (SELECT id FROM auth.users LIMIT 1), ARRAY['Fire Safety', 'Code Compliance', 'Emergency Systems']),

-- Emergency and Urgent Projects
('Structural Repair Emergency', 'Emergency structural repairs to ensure building safety and code compliance', 'Structural', 'critical', 'open', 100000, 150000, '2024-02-10', '2024-01-28', 'Downtown Office Complex', (SELECT id FROM auth.users LIMIT 1), ARRAY['Structural Engineering', 'Emergency Response', 'Safety Compliance']),
('Flood Damage Restoration', 'Complete restoration services following water damage including remediation and rebuilding', 'Restoration', 'critical', 'open', 75000, 110000, '2024-02-25', '2024-01-20', 'Affected Properties District', (SELECT id FROM auth.users LIMIT 1), ARRAY['Water Damage Restoration', 'Emergency Response', 'Remediation']),

-- Large Scale Projects
('Multi-Building Infrastructure Upgrade', 'Comprehensive infrastructure upgrade across 5 buildings including utilities and systems', 'Infrastructure', 'high', 'open', 200000, 300000, '2024-09-01', '2024-05-01', 'Campus Complex', (SELECT id FROM auth.users LIMIT 1), ARRAY['Infrastructure', 'Multi-Building', 'Project Management']),
('Green Energy Conversion Project', 'Convert buildings to renewable energy with solar panels, efficient systems, and smart grids', 'Energy', 'medium', 'open', 180000, 250000, '2024-08-15', '2024-05-01', 'Sustainability Campus', (SELECT id FROM auth.users LIMIT 1), ARRAY['Renewable Energy', 'Solar Installation', 'Smart Grid Technology']),

-- Specialized Service Contracts
('24/7 Facility Management Contract', 'Comprehensive facility management including maintenance, security, and operations', 'Management', 'high', 'open', 150000, 200000, '2024-12-31', '2024-02-01', 'Corporate Campus', (SELECT id FROM auth.users LIMIT 1), ARRAY['Facility Management', '24/7 Operations', 'Multi-Service']),
('Elevator Modernization Program', 'Modernize elevator systems across multiple buildings with smart controls and safety upgrades', 'Elevators', 'high', 'open', 120000, 170000, '2024-06-30', '2024-03-01', 'High-Rise Properties', (SELECT id FROM auth.users LIMIT 1), ARRAY['Elevator Systems', 'Modernization', 'Safety Upgrades']),

-- Technology and Innovation Projects
('IoT Sensor Network Installation', 'Install comprehensive IoT sensor network for building monitoring and optimization', 'IoT', 'medium', 'open', 45000, 65000, '2024-04-30', '2024-03-01', 'Smart Building Pilot', (SELECT id FROM auth.users LIMIT 1), ARRAY['IoT Technology', 'Sensor Networks', 'Data Analytics']),
('Building Information Modeling (BIM) Implementation', 'Implement BIM systems for facility management and maintenance optimization', 'Technology', 'low', 'open', 35000, 50000, '2024-05-31', '2024-03-15', 'Modern Office Complex', (SELECT id FROM auth.users LIMIT 1), ARRAY['BIM Technology', 'Facility Management', 'Digital Modeling']),

-- Seasonal and Maintenance Projects
('Winter Preparation and Weatherization', 'Comprehensive winter preparation including heating system checks and weatherproofing', 'Seasonal', 'medium', 'open', 25000, 40000, '2024-11-01', '2024-09-15', 'Multiple Properties', (SELECT id FROM auth.users LIMIT 1), ARRAY['Seasonal Maintenance', 'Weatherization', 'Heating Systems']),
('Spring Facility Renewal Program', 'Comprehensive spring maintenance and renewal program including cleaning and repairs', 'Seasonal', 'low', 'open', 30000, 45000, '2024-04-01', '2024-03-01', 'Resort Properties', (SELECT id FROM auth.users LIMIT 1), ARRAY['Spring Maintenance', 'Facility Renewal', 'Comprehensive Service']);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to project_documents if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_project_documents_updated_at'
    ) THEN
        CREATE TRIGGER update_project_documents_updated_at
            BEFORE UPDATE ON public.project_documents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;