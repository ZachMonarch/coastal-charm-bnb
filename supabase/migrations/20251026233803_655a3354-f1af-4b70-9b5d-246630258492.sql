-- Enable RLS on snapshot table (admin-only access)
ALTER TABLE profiles_snapshot_20251026_corrupted ENABLE ROW LEVEL SECURITY;

CREATE POLICY snapshot_admin_only ON profiles_snapshot_20251026_corrupted
FOR ALL USING (is_admin_user(auth.uid()));