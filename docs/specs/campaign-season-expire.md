# Campaign season expire job

**Not application code.** Status flips live → ended when `ends_at` passes live **outside** the Next.js app.

## Why

- Request paths must not write on read (latency, race noise, harder to reason about).
- Competitive **freeze** and **reference reveal** use pure effective status from timestamps in app code (`src/lib/campaign-season-status.ts`).
- Persisted `campaign_seasons.status = 'ended'` is for operators, RLS/reporting, and eventual consistency of the row.

## Function

Migration: `supabase/migrations/20260810120000_campaign_expire_seasons.sql`

```sql
SELECT public.campaign_expire_seasons();  -- returns rows updated
```

Only `service_role` / postgres may execute (not JWT clients).

## Schedule (pick one)

### Supabase pg_cron (recommended)

```sql
select cron.schedule(
  'campaign-expire-seasons',
  '*/5 * * * *',
  $$ select public.campaign_expire_seasons(); $$
);
```

### External cron

Any host that can run SQL against the project DB as a privileged role:

```bash
# example: psql with service connection
psql "$DATABASE_URL" -c 'select public.campaign_expire_seasons();'
```

Do **not** add a Next.js `/api/cron/*` route for this unless product explicitly requires it later.

## App behavior without the job

Until the job runs, DB may still say `live` after `ends_at`. App still freezes start/submit and may reveal references via **effective** status. The job catches up the column.
