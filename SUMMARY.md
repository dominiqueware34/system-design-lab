# Artifact 2 — Solo multi-problem levels (#11)

## PR

https://github.com/dominiqueware34/system-design-lab/pull/22

## What shipped

Replace legacy 15×1 CampaignMap on `/solo` with **2 multi-problem levels**:

| Level | Title | Content | Unlock |
| --- | --- | --- | --- |
| `solo-l1` | Foundations | 10 classic problems | Open |
| `solo-l2` | Agentic Frontier | 6 agentic problems | All of L1 complete |

### Content (constants + APIs)
- `src/lib/solo-levels.ts` — `SOLO_LEVELS` (data-driven)
- `GET /api/solo/levels`
- `GET /api/problems`, `GET /api/problems/[id]`

### Progress
- localStorage `sdl-solo-progress-v1`
- Supabase `solo_progress` (`supabase/migrations/20260809120000_solo_progress.sql`)
  - Seeds from `campaign_progress` map completions when empty
- `GET/PUT /api/progress/solo`
- Merge-on-login includes solo (`POST /api/progress/merge`)
- Per problem: `bestScore`, `stars`, `durationMs` (first qualifying finish)

### Canvas
- `/design/[problemId]?solo=solo-l1` (or `solo-l2`)
- **No wrenches** — uses evaluate API
- Pass when `score >= passScore` → writes progress + duration
- Completing one problem ≠ completing level

### UI
- `SoloHub` on `/solo` — L1/L2 cards, lock state, per-problem stars/duration
- FEATURES.md Solo Mode entry

## How to test

```bash
npm install
npm test
NODE_ENV=production npx next build

# Apply migration in Supabase SQL editor (or CLI):
# supabase/migrations/20260809120000_solo_progress.sql

npm run dev
```

Manual:
1. Open `/solo` — L1 unlocked, L2 locked.
2. Open a L1 problem → canvas shows “Solo · no wrenches”.
3. Submit design with score ≥ passScore (or mock) → problem marked complete; duration stored.
4. Confirm one problem complete does **not** unlock L2.
5. Guest: check `localStorage['sdl-solo-progress-v1']`.
6. Sign in: merge should hydrate; `GET /api/progress/solo` when authed.
7. `curl localhost:3000/api/solo/levels` and `/api/problems`.

## Out of scope (intentional)

- Campaign seasons tables / submit API / leaderboard
- Plan B constraint engine
- Removing legacy `campaign.ts` / wrench path entirely (`?campaign=w*` still works)

## Risks

- Supabase migration must be applied or signed-in solo sync/merge will error on missing `solo_progress`.
- Legacy map progress seeds problems but `durationMs: 0` (unknown).
- L1 includes `multi-tenant-saas-db` which was not on the old map — full L1 still requires that problem for unlock.
