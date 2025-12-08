-- Fix vendor_applications status check to include all valid statuses
ALTER TABLE vendor_applications DROP CONSTRAINT IF EXISTS vendor_applications_status_check;
ALTER TABLE vendor_applications ADD CONSTRAINT vendor_applications_status_check 
  CHECK (status = ANY (ARRAY['open', 'in_progress', 'completed', 'cancelled', 'submitted', 'under_review', 'awarded', 'rejected', 'expired', 'draft', 'pending']));

-- Also add similar constraint for vendor_bids if needed
ALTER TABLE vendor_bids DROP CONSTRAINT IF EXISTS vendor_bids_status_check;
ALTER TABLE vendor_bids ADD CONSTRAINT vendor_bids_status_check 
  CHECK (status = ANY (ARRAY['open', 'in_progress', 'completed', 'cancelled', 'submitted', 'under_review', 'awarded', 'rejected', 'expired', 'draft', 'pending']));