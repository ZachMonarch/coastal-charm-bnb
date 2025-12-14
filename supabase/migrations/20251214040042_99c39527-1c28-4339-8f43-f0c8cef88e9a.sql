-- Phase 1: Fix vendor_bids foreign key constraints
ALTER TABLE vendor_bids DROP CONSTRAINT IF EXISTS vendor_bids_application_projects_fk;
ALTER TABLE vendor_bids DROP CONSTRAINT IF EXISTS vendor_bids_vendor_id_fkey;
ALTER TABLE vendor_bids ADD CONSTRAINT vendor_bids_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Phase 2: Create vendor_contacts table for CRM functionality
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL DEFAULT 'contact' CHECK (contact_type IN ('lead', 'contact', 'partner', 'customer')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  source TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'converted', 'lost')),
  last_contact_date TIMESTAMPTZ,
  next_followup_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policy: vendors can only access their own contacts
CREATE POLICY vendor_contacts_own_access ON vendor_contacts
  FOR ALL USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_type ON vendor_contacts(contact_type);

-- Trigger for updated_at
CREATE TRIGGER update_vendor_contacts_updated_at
  BEFORE UPDATE ON vendor_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();