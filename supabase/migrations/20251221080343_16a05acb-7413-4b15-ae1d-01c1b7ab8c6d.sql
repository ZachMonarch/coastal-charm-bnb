-- Grant EXECUTE permissions on existing app schema functions to authenticated users
GRANT EXECUTE ON FUNCTION app.current_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION app.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION app.user_id() TO authenticated;

-- Also add a fallback admin policy that doesn't rely on app schema functions
-- This ensures admins can always access RFQs even if app functions have issues
DROP POLICY IF EXISTS rfqs_admin_fallback ON public.rfqs;
CREATE POLICY rfqs_admin_fallback ON public.rfqs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );