-- Fix foreign key relationships for vendor_bids table
ALTER TABLE vendor_bids ADD CONSTRAINT vendor_bids_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE vendor_bids ADD CONSTRAINT vendor_bids_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES projects(id) ON DELETE CASCADE;