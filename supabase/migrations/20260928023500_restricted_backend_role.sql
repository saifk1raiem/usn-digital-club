-- Runtime role only. Assign its password out-of-band and keep it in server-only secrets.
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usn_app') THEN
    CREATE ROLE usn_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  ELSE
    ALTER ROLE usn_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$migration$;

GRANT CONNECT ON DATABASE postgres TO usn_app;
GRANT USAGE ON SCHEMA public TO usn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO usn_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO usn_app;

DO $policies$
DECLARE
  target_table record;
BEGIN
  FOR target_table IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table.tablename
        AND policyname = 'usn_backend_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY usn_backend_access ON public.%I FOR ALL TO usn_app USING (true) WITH CHECK (true)',
        target_table.tablename
      );
    END IF;
  END LOOP;
END
$policies$;
