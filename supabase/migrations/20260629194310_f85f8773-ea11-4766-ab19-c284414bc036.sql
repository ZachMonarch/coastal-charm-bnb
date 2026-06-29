
-- 1. Remove duplicate weak INSERT policy on app.rfqs (lacks role check)
DROP POLICY IF EXISTS "app_rfqs_unified_insert" ON app.rfqs;

-- 2. Split work_orders_unified_manage_v2 to prevent INSERT bypass.
-- The OR-ed WITH CHECK allowed any user to insert by setting created_by = self.
-- Replace with SELECT/UPDATE/DELETE only; INSERT remains gated by work_orders_unified_insert (tenant+role).
DROP POLICY IF EXISTS "work_orders_unified_manage_v2" ON public.work_orders;

CREATE POLICY "work_orders_unified_manage_v2_select" ON public.work_orders
FOR SELECT TO authenticated
USING (
  assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR (tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
);

CREATE POLICY "work_orders_unified_manage_v2_update" ON public.work_orders
FOR UPDATE TO authenticated
USING (
  assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR (tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager')))
)
WITH CHECK (
  tenant_id = app.current_tenant()
  AND (app.has_role('admin') OR app.has_role('property_manager') OR assigned_to = auth.uid() OR created_by = auth.uid())
);

CREATE POLICY "work_orders_unified_manage_v2_delete" ON public.work_orders
FOR DELETE TO authenticated
USING (
  tenant_id = app.current_tenant() AND (app.has_role('admin') OR app.has_role('property_manager'))
);
