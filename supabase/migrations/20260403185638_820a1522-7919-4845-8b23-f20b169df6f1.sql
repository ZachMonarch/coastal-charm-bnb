-- Remove projects and notifications from Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE projects;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Tighten sent_emails INSERT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'sent_emails_system_insert' AND tablename = 'sent_emails'
  ) THEN
    DROP POLICY sent_emails_system_insert ON public.sent_emails;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'sent_emails_authenticated_insert' AND tablename = 'sent_emails'
  ) THEN
    CREATE POLICY sent_emails_authenticated_insert ON public.sent_emails
      FOR INSERT TO authenticated
      WITH CHECK (sent_by = auth.uid());
  END IF;
END $$;