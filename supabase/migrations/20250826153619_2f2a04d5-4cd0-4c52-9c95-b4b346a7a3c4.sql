-- Fix the vendor_bids table to properly reference projects instead of vendor_applications
-- Create a view to better understand the relationship

-- First, let's see the current structure
COMMENT ON TABLE vendor_bids IS 'Bids submitted by vendors for specific projects';

-- The vendor_bids.application_id should reference projects.id, not vendor_applications.id
-- Let's add a proper foreign key constraint if it doesn't exist

-- Add a foreign key constraint for vendor_bids to reference projects
ALTER TABLE vendor_bids 
DROP CONSTRAINT IF EXISTS vendor_bids_application_projects_fk;

ALTER TABLE vendor_bids 
ADD CONSTRAINT vendor_bids_application_projects_fk 
FOREIGN KEY (application_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Update the comment to clarify the relationship
COMMENT ON COLUMN vendor_bids.application_id IS 'References projects.id - the project this bid is for';

-- Add index for better performance on project bids lookup
CREATE INDEX IF NOT EXISTS idx_vendor_bids_project_vendor 
ON vendor_bids(application_id, vendor_id, status);

-- Create a view for easier querying of project bids with project details
CREATE OR REPLACE VIEW project_bids_view AS
SELECT 
    vb.id as bid_id,
    vb.vendor_id,
    vb.bid_amount,
    vb.proposal_details,
    vb.estimated_duration,
    vb.status as bid_status,
    vb.submitted_at,
    p.id as project_id,
    p.title as project_title,
    p.description as project_description,
    p.category as project_category,
    p.budget_min,
    p.budget_max,
    p.location,
    p.deadline,
    p.status as project_status,
    vp.company_name as vendor_company,
    vp.rating as vendor_rating,
    prof.full_name as vendor_name
FROM vendor_bids vb
JOIN projects p ON vb.application_id = p.id
LEFT JOIN vendor_profiles vp ON vb.vendor_id = vp.user_id
LEFT JOIN profiles prof ON vb.vendor_id = prof.id;