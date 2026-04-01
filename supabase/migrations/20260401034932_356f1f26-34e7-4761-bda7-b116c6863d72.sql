
-- Restrict rfqs policies to authenticated
ALTER POLICY "app_rfqs_unified_select" ON app.rfqs TO authenticated;
ALTER POLICY "app_rfqs_unified_insert" ON app.rfqs TO authenticated;
ALTER POLICY "app_rfqs_unified_update" ON app.rfqs TO authenticated;
ALTER POLICY "app_rfqs_unified_delete" ON app.rfqs TO authenticated;

-- Restrict rfq_invites policies to authenticated
ALTER POLICY "app_rfq_invites_unified_select" ON app.rfq_invites TO authenticated;
ALTER POLICY "app_rfq_invites_unified_insert" ON app.rfq_invites TO authenticated;
ALTER POLICY "app_rfq_invites_unified_update" ON app.rfq_invites TO authenticated;
ALTER POLICY "app_rfq_invites_unified_delete" ON app.rfq_invites TO authenticated;

-- Restrict rfq_lots policies to authenticated
ALTER POLICY "app_rfq_lots_unified_select" ON app.rfq_lots TO authenticated;
ALTER POLICY "app_rfq_lots_unified_insert" ON app.rfq_lots TO authenticated;
ALTER POLICY "app_rfq_lots_unified_update" ON app.rfq_lots TO authenticated;
ALTER POLICY "app_rfq_lots_unified_delete" ON app.rfq_lots TO authenticated;

-- Restrict bid_lines policies to authenticated
ALTER POLICY "app_bid_lines_unified_select" ON app.bid_lines TO authenticated;
ALTER POLICY "app_bid_lines_unified_insert" ON app.bid_lines TO authenticated;
ALTER POLICY "app_bid_lines_unified_update" ON app.bid_lines TO authenticated;
ALTER POLICY "app_bid_lines_unified_delete" ON app.bid_lines TO authenticated;
