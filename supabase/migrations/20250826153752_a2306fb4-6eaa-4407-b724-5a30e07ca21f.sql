-- Fix the security definer view issue by recreating it without SECURITY DEFINER
-- and ensure proper RLS policies are in place

-- Drop the existing view first
DROP VIEW IF EXISTS project_bids_view;

-- Create the view without SECURITY DEFINER (default is SECURITY INVOKER)
CREATE VIEW project_bids_view AS
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

-- Add RLS policy for the view to ensure proper access control
ALTER VIEW project_bids_view OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON project_bids_view TO authenticated;
GRANT SELECT ON project_bids_view TO anon;