# Artifact 4 — Campaign seasons DB schema (#14)

## PR

https://github.com/dominiqueware34/system-design-lab/pull/21

## What shipped (this branch)

Competitive Campaign **schema + RLS + seed path** (no season UI, no submit API):

### Migrations (apply in order)

| File | Tables / objects |
| --- | --- |
| `supabase/migrations/20260809120000_profiles.sql` | `profiles` (+ auth.users trigger for display_name/avatar) |
| `supabase/migrations/20260809120100_campaign_seasons_and_prompts.sql` | `campaign_seasons`, `campaign_prompts`, view `campaign_prompts_public` |
| `supabase/migrations/20260809120200_campaign_play_tables.sql` | `campaign_prompt_sessions`, `campaign_attempts`, `campaign_season_scores`, view `campaign_leaderboard` |

### Seed

- `scripts/seed-season.ts` + `npm run seed:season`
- Loads `fixtures/campaign/season-prompts-v1.json` → **draft** season `season-v1-draft` + 20 prompts
- Stores client-safe `problem` JSONB separately from server-only `reference_design` / `rationale`
- `rules`: `{ score_formula: "v1_correct_diff_cover", max_attempts: 3 }`

### Security invariants (SQL comments + RLS/grants)

- No authenticated INSERT/UPDATE/DELETE on attempts or season_scores (service_role later in Artifact 5)
- `reference_design` + `rationale` **column-revoked** from JWT roles; public view omits them
- Draft seasons not selectable by clients; live/ended only
- Sticky sessions: own INSERT/SELECT, no UPDATE (started_at sticky)
- Public LB view has **no duration fields**

## How to apply migrations

### Option A — Supabase SQL Editor

1. Open project → SQL Editor.
2. Paste/run each file **in timestamp order**:
   - `20260809120000_profiles.sql`
   - `20260809120100_campaign_seasons_and_prompts.sql`
   - `20260809120200_campaign_play_tables.sql`
3. (If not already applied) also ensure progress migration `20260327120000_progress_tables.sql` exists.

### Option B — Supabase CLI

```bash
supabase db push
# or: supabase migration up
```

## How to seed

```bash
# validate fixture only (no secrets)
npm run seed:season -- --dry-run

# write draft season (requires service role)
export NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...   # never NEXT_PUBLIC_
npm run seed:season
# optional: --slug other-draft --title "My draft"
```

Draft seasons stay **invisible** to authenticated clients until status is set to `live` (operator / later artifact).

## How to test (local, no DB)

```bash
npm install
npm test
npm run seed:season -- --dry-run
```

## Out of scope (intentional)

- Solo multi-problem / `solo_progress` / DesignWorkspace (#11)
- Campaign submit API + scoring runtime (#17 / Artifact 5)
- Season UI + leaderboard UI (#12 / Artifact 6)
- Hardening / auto end / reference reveal (#10 / Artifact 7)
- Secrets committed

## Risks

- Column-level `GRANT SELECT (…)` on `campaign_prompts` depends on Postgres privileges; if a host role still has blanket SELECT, double-check with `\dp` / Supabase policy tests. Prefer `campaign_prompts_public` view in APIs.
- `security_invoker` views need Postgres 15+ (Supabase default).
- Seed refuses to reseed a season that is already `live` — use a new slug.
- Promoting draft → live is **manual** (no operator UI yet); do not flip live until Artifact 5 is ready.
