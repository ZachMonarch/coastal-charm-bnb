-- =============================================
-- PHASE 1: Create team_members and vendor_portfolio_items tables
-- =============================================

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  department TEXT,
  title TEXT,
  avatar_url TEXT,
  bio TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor_portfolio_items table
CREATE TABLE IF NOT EXISTS vendor_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT,
  completion_date DATE,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY team_members_read ON team_members 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY team_members_admin_manage ON team_members 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Enable RLS on vendor_portfolio_items
ALTER TABLE vendor_portfolio_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_portfolio_items
CREATE POLICY vendor_portfolio_public_read ON vendor_portfolio_items 
  FOR SELECT USING (true);

CREATE POLICY vendor_portfolio_vendor_manage ON vendor_portfolio_items 
  FOR ALL USING (vendor_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_vendor_portfolio_vendor ON vendor_portfolio_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_portfolio_category ON vendor_portfolio_items(category);

-- Create storage bucket for vendor portfolio (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vendor_portfolio', 'vendor_portfolio', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policy for vendor portfolio uploads
CREATE POLICY vendor_portfolio_upload ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor_portfolio' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY vendor_portfolio_public_read ON storage.objects 
  FOR SELECT USING (bucket_id = 'vendor_portfolio');

CREATE POLICY vendor_portfolio_owner_delete ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'vendor_portfolio' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );