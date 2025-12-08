-- Remove the problematic view entirely to resolve security issues
-- The view is not essential for basic functionality

DROP VIEW IF EXISTS project_bids_view CASCADE;

-- Instead, we'll rely on direct table queries with proper joins
-- This eliminates the security definer issue completely