-- Final RLS policies for remaining tables

-- Backup/snapshot tables - admin only
CREATE POLICY "snapshot_corrupted_admin_only" ON public.profiles_snapshot_20251026_corrupted
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "security_backup_admin_only" ON public.security_backup_profiles_role_20251025
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()));

-- bid_lines already has policies from app schema, but add public schema fallback
CREATE POLICY "bid_lines_select_vendor" ON public.bid_lines
  FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "bid_lines_select_staff" ON public.bid_lines
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'property_manager'));

CREATE POLICY "bid_lines_insert_vendor" ON public.bid_lines
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "bid_lines_update_own" ON public.bid_lines
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "bid_lines_delete_own" ON public.bid_lines
  FOR DELETE TO authenticated
  USING (vendor_id = auth.uid() OR is_admin_user(auth.uid()));