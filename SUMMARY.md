# Artifact 5 — Campaign submit API + scoring (#17)

**Branch:** `feat/campaign-submit-api`  
**Status:** Implemented

## Work breakdown

- [x] Claim BOARD/STATUS; branch `feat/campaign-submit-api`
- [x] Pure module `src/lib/campaign-scoring.ts` + unit tests
- [x] GET `/api/campaign/seasons/current` (any)
- [x] GET `/api/campaign/seasons/:id/prompts` (auth; strip reference)
- [x] POST `/api/campaign/prompts/:promptId/start` (auth; sticky started_at)
- [x] POST `/api/campaign/submit` (auth; max 3; server-authoritative; private duration_ms)
- [x] GET leaderboard (any, no times) + GET `.../me` (auth, private durations OK)
- [x] Reject 4th attempt; client cannot forge score; open PR

## Acceptance

| Check | How |
| --- | --- |
| Client cannot forge score | Submit ignores client score fields; server runs SpaceXAI evaluate → bands → points |
| 4th attempt rejected | HTTP 409 when `priorCount >= max_attempts` (default 3) |
| started_at sticky | `ensurePromptSession` insert-once; conflict re-selects; no UPDATE |
| LB payload has no duration | `campaign_leaderboard` select + `sanitizeLeaderboardRow` + fixed JSON shape |
| Unit tests for scoring | `src/lib/campaign-scoring.test.ts` via `npm test` |

## Files

- `src/lib/campaign-scoring.ts` + `.test.ts`
- `src/lib/campaign-db.ts`, `src/lib/campaign-evaluate.ts`
- `src/lib/supabase/admin.ts`
- `src/app/api/campaign/seasons/current/route.ts`
- `src/app/api/campaign/seasons/[id]/prompts/route.ts`
- `src/app/api/campaign/seasons/[id]/leaderboard/route.ts`
- `src/app/api/campaign/seasons/[id]/me/route.ts`
- `src/app/api/campaign/prompts/[promptId]/start/route.ts`
- `src/app/api/campaign/submit/route.ts`
- `docs/brain/FEATURES.md`

## How to test

```bash
npm test                          # scoring unit tests
# With Supabase + SERVICE_ROLE + live season seeded:
# GET  /api/campaign/seasons/current
# GET  /api/campaign/seasons/:id/leaderboard
# Auth:
# GET  /api/campaign/seasons/:id/prompts
# POST /api/campaign/prompts/:promptId/start
# POST /api/campaign/submit  { "promptId": "...", "design": { "nodes": [], "edges": [] } }
# GET  /api/campaign/seasons/:id/me
# 4th submit → 409
```

Requires: migrations applied, `npm run seed:season` (then set season `status=live`), `SUPABASE_SERVICE_ROLE_KEY`, `XAI_API_KEY` for submit.

## Leftover risks

- Submit depends on live XAI evaluate (latency + cost); no offline mock score path.
- Service role required for all campaign season routes (anon has no RLS grants).
- No end-to-end integration tests against real Supabase in CI.
- Season UI (#12) and hardening (#10) not in scope.

## Deferred

- None required for acceptance. Campaign season UI remains #12.
