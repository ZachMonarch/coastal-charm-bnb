-- Add basic RLS policies for tables that are missing them after the function recreation

-- Add admin policy for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add admin policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add admin policies for system_health
CREATE POLICY "Admins can manage system health"
ON public.system_health
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add policies for payment_templates
CREATE POLICY "Users can view active templates"
ON public.payment_templates
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage payment templates"
ON public.payment_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Add policies for payment_documents
CREATE POLICY "Admins can manage payment documents"
ON public.payment_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);