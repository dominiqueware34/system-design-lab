-- Campaign season expire job (Artifact 7 reduced / #10)
--
-- App code never writes status on read. Competitive freeze + reference reveal
-- use timestamp-aware *effective* status in the Next app; this function
-- persists live → ended for reporting, RLS, and operator dashboards.
--
-- Schedule OUTSIDE the Next.js app, e.g. Supabase pg_cron:
--
--   select cron.schedule(
--     'campaign-expire-seasons',
--     '*/5 * * * *',
--     $$ select public.campaign_expire_seasons(); $$
--   );
--
-- Or any external scheduler that runs:
--   select public.campaign_expire_seasons();
-- as a privileged role (service_role / postgres).

CREATE OR REPLACE FUNCTION public.campaign_expire_seasons()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.campaign_seasons
  SET
    status = 'ended',
    updated_at = now()
  WHERE status = 'live'
    AND ends_at IS NOT NULL
    AND ends_at < now();

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.campaign_expire_seasons() IS
  'Async job: set campaign_seasons.status to ended when ends_at has passed. '
  'Not invoked from Next.js request paths. Schedule via pg_cron or external cron.';

-- Callable by service_role only (not anon/authenticated JWT).
REVOKE ALL ON FUNCTION public.campaign_expire_seasons() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.campaign_expire_seasons() FROM anon;
REVOKE ALL ON FUNCTION public.campaign_expire_seasons() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.campaign_expire_seasons() TO service_role;
