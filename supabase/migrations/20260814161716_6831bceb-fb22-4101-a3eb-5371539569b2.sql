-- 1. Clear ERROR-level Security Definer View
ALTER VIEW public.bookings_staff_view SET (security_invoker = true);

-- 2. Pin search_path on the last mutable function
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 3. Revoke anon EXECUTE on SECURITY DEFINER functions, except intentionally public RPCs
DO $$
DECLARE
  r record;
  allowlist text[] := ARRAY[
    'get_public_property_listings',
    'get_public_property_count',
    'get_public_rfq',
    'get_public_rfqs',
    'check_rate_limit',
    'check_auth_rate_limit',
    'optimized_rate_limit_check',
    'log_security_event',
    'log_security_audit'
  ];
BEGIN
  FOR r IN
    SELECT n.nspname, p.oid::regprocedure AS sig, t.typname = 'trigger' AS is_trigger, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE p.prosecdef
      AND n.nspname IN ('public', 'app')
  LOOP
    IF r.is_trigger THEN
      -- trigger functions are never called directly by clients
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated, PUBLIC', r.sig);
    ELSIF NOT (r.proname = ANY (allowlist)) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, PUBLIC', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
  END LOOP;
END $$;
