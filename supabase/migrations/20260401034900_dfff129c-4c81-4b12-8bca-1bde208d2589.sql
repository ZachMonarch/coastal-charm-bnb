
-- Fix: ALTER bids policies from {public} to {authenticated} (app schema)
ALTER POLICY "app_bids_unified_select" ON app.bids TO authenticated;
ALTER POLICY "app_bids_unified_insert" ON app.bids TO authenticated;
ALTER POLICY "app_bids_unified_update" ON app.bids TO authenticated;
ALTER POLICY "app_bids_unified_delete" ON app.bids TO authenticated;

-- Fix: Drop overly permissive documents bucket upload policy
DROP POLICY IF EXISTS "documents_authenticated_upload" ON storage.objects;
