# Background jobs (Supabase Cron + Edge Functions + Queues)

> **Docs only** — no runtime in this artifact.  
> **Planning issue:** [#28](https://github.com/dominiqueware34/system-design-lab/issues/28)  
> Related: Artifact 7 reduced / #10 (request-path freeze + ref reveal on Next app); #25 rate limits; #26 next-season seed.

## Purpose

Durable work that must **not** run inside the Next.js App Router request path:

| Work | Why async |
| --- | --- |
| Persist `campaign_seasons.status` live → ended | Operator/RLS/reporting consistency; app already freezes via timestamps |
| Future: next-season seed (#26) | Operator batch; long-running |
| Future: multi-type workers | Retries, fan-out, isolation from HTTP latency |

**Hard rule:** no Next.js `/api/cron/*`, no write-on-read season status sync in campaign APIs.

## Architecture (locked v1)

**First job pattern: Cron → Edge Function** (no queue required for season expire).

```
  Supabase Cron (every 1–5 min)
        │
        ▼
  Edge Function: expire-seasons
        │
        ▼
  Postgres: UPDATE campaign_seasons
            SET status = 'ended'
            WHERE status = 'live'
              AND ends_at IS NOT NULL
              AND ends_at < now()
```

### Platform roadmap (Queues)

For **multi-job** workloads (seed, notifications, etc.), adopt **Supabase Queues** (Postgres [pgmq](https://supabase.com/docs/guides/queues)):

```
  Cron / producer EF
        │  enqueue message { type, payload }
        ▼
  Supabase Queue (pgmq)
        │
        ▼
  Edge Function: queue-worker
        │  read → handle by type → delete
        ▼
  Postgres / side effects
```

| Pattern | Use when |
| --- | --- |
| **A. Cron → Edge Function** (v1) | Simple periodic scan (expire seasons) |
| **B. Cron → Queue → Edge worker** | Multiple job types, retries, visibility timeout |

v1 implements **A** only. Spec **B** so implementers do not invent ad-hoc queues later.

## First job: `expire-seasons`

| Item | Spec |
| --- | --- |
| Name | `expire-seasons` (Edge Function) |
| Trigger | Supabase Cron, every **1–5 minutes** |
| Work | Idempotent `UPDATE` as above; return `{ updated: N }` |
| Auth | Service role / EF secrets only — never JWT clients |
| App dependency | **None** — Next app uses pure `effectiveSeasonStatus` for freeze/reveal (`src/lib/campaign-season-status.ts`) |
| Observability | Log rows updated; optional structured JSON response for Cron history |

### Why not do this on read paths

- Couples HTTP latency to writes  
- Racey under concurrent traffic  
- Harder to reason about; violates “async job outside app” product preference  

## Repo layout (implement later — Jobs-1)

```
supabase/
  config.toml                 # already present
  migrations/                 # optional: helpers, grants; pgmq enable when Queues land
  functions/
    expire-seasons/
      index.ts                # Cron target
    queue-worker/             # Jobs-2 optional
docs/specs/background-jobs.md # this file
```

No job code under `src/app/api/`.

## Security

- Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` (or restricted DB role) via secrets  
- Do not grant queue admin / expire RPCs to `anon` / `authenticated`  
- Jobs must never return `reference_design` to untrusted callers  
- Align with campaign invariants in Artifact 4 migrations  

## Local / production ops

1. Apply migrations; deploy function: `supabase functions deploy expire-seasons`  
2. Set secrets in project  
3. Schedule Cron job → Edge Function (Dashboard: Cron → type Edge Function, or `cron.schedule` HTTP invoke)  
4. Smoke: set a live season with `ends_at` in the past → after tick, `status = ended`  

## Relation to #10 and FEATURES

| Layer | Responsibility | Ship vehicle |
| --- | --- | --- |
| Next app | Effective status freeze + ref reveal | PR #27 / #10 (API-only) |
| Background | Persist DB `status` | Jobs-1 (this platform) |
| FEATURES | Product freeze/reveal when #10 merges; “Background jobs” row when Jobs-1 merges | — |

## Out of scope

- Rate limits (#25)  
- Next-season seed automation (#26) — may become first Queue job later  
- Moving SpaceXAI evaluate onto a queue (optional future)  
- Next.js cron routes  

## Key decisions

1. **Cron → EF for expire** — simplest correct v1; no queue tax for one UPDATE.  
2. **Queues documented, not required for expire** — platform path for multi-job.  
3. **Jobs live under `supabase/functions`** — not Next app code.  
4. **App remains correct if job lags** — timestamps are SSOT for competitive rules.  

## PR Plan

| PR | Title | Contents | Depends |
| --- | --- | --- | --- |
| Docs-1 | `docs: background jobs (Cron + Edge Functions + Queues)` | This spec + planning issue link | — |
| Jobs-1 | `feat(jobs): expire-seasons Edge Function + Cron` | `supabase/functions/expire-seasons`, deploy/Cron docs, FEATURES row | Docs-1 |
| Jobs-2 (optional) | `feat(jobs): queue worker for multi-type jobs` | pgmq, worker EF, first non-expire job type | Jobs-1 |

## Open questions (implement time)

1. Cron interval: 1 min vs 5 min?  
2. Dashboard Cron vs SQL `cron.schedule` as SSOT for prod?  
3. When does #26 seed move onto Queue pattern B?  
