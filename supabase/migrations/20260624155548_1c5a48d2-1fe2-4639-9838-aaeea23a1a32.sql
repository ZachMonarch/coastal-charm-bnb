
-- 1. profile-photos bucket: remove public SELECT, allow owner only + admins
DROP POLICY IF EXISTS "Profile photos are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Public profile photo access" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Profile photos viewable by owner') THEN
    CREATE POLICY "Profile photos viewable by owner"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Profile photos viewable by admins') THEN
    CREATE POLICY "Profile photos viewable by admins"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'profile-photos'
        AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      );
  END IF;
END$$;

-- 2. rfqs INSERT permissive policy — restrict to admin / property_manager
DROP POLICY IF EXISTS "app_rfqs_unified_insert" ON public.rfqs;
CREATE POLICY "app_rfqs_unified_insert"
  ON public.rfqs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = app.current_tenant()
    AND (
      EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','property_manager'))
    )
  );

-- 3. rfq_lots tenant-wide SELECT — require admin/PM role
DROP POLICY IF EXISTS "app_rfq_lots_unified_select" ON public.rfq_lots;
CREATE POLICY "app_rfq_lots_unified_select"
  ON public.rfq_lots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r
      WHERE r.id = rfq_lots.rfq_id
        AND r.tenant_id = app.current_tenant()
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin','property_manager')
        )
    )
  );

-- 4. rfq_scoring_weights — restrict SELECT to admin/PM
DROP POLICY IF EXISTS "anyone authed can view scoring weights" ON public.rfq_scoring_weights;
CREATE POLICY "admins and pms can view scoring weights"
  ON public.rfq_scoring_weights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','property_manager')
    )
  );
