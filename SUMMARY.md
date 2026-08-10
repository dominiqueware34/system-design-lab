# Artifact 6 — Campaign season UI + leaderboard (#12)

**Branch:** `feat/campaign-season-ui`

## Done

- [x] `/campaign` hub: guest pitch + Google; signed-in season hub (timer, N/20, play, LB + my stats)
- [x] `/campaign/play/[promptId]`: auth gate (server + client), start session, canvas `mode: "campaign"`
- [x] Submit only to `/api/campaign/submit`; stars + attempts left; **no wrenches**
- [x] Guest cannot open play routes (redirect → `/campaign?signin=1`)
- [x] `/campaign/leaderboard` — rank, name, season_score, stars, prompts (**no time column**)
- [x] `/campaign/stats` — private times per prompt via `/me`
- [x] `FEATURES.md` Campaign seasons MVP UI
- [x] Commit + PR

## Files changed (product)

| Path | Role |
| --- | --- |
| `src/lib/campaign-client.ts` | Client API helpers + problem coerce |
| `src/components/campaign/CampaignHub.tsx` | Signed-in season hub |
| `src/components/campaign/CampaignPlayClient.tsx` | Play boot: start + workspace |
| `src/components/campaign/CampaignLeaderboard.tsx` | Public LB UI |
| `src/components/campaign/CampaignMyStats.tsx` | Private times |
| `src/app/campaign/page.tsx` | Guest / signed-in shell |
| `src/app/campaign/play/[promptId]/page.tsx` | Server auth gate |
| `src/app/campaign/leaderboard/page.tsx` | LB route |
| `src/app/campaign/stats/page.tsx` | Stats route (auth) |
| `src/components/canvas/DesignWorkspace.tsx` | `mode: "campaign"` submit path |
| `src/components/canvas/EvaluationPanel.tsx` | Campaign stars / attempts UI |
| `src/components/nav/AppNav.tsx` | Hide nav on `/campaign/play` |
| `docs/brain/FEATURES.md` | Ship Campaign seasons MVP UI |
| `docs/brain/PRODUCT.md` | Campaign mode shipped note |

## How to test

1. Ensure migrations applied, season seeded and set **live**, `SUPABASE_SERVICE_ROLE_KEY` + `XAI_API_KEY` set.
2. Guest: open `/campaign` → Google CTA; `/campaign/play/<id>` → redirect to hub; `/campaign/leaderboard` works without auth.
3. Sign in → hub shows countdown, coverage N/20, prompt list.
4. Play a prompt → sticky timer starts → submit design → stars + attempts left (≤3) → season score updates.
5. `/campaign/leaderboard` → appear with score/stars/prompts; **no duration column**.
6. `/campaign/stats` → private `durationMs` per attempt.
7. Network tab on prompts/submit responses: no `reference_design` / `referenceDesign`.

## Leftover risks

- Needs a **live** season in DB (seed is draft by default — operator must promote).
- Full E2E with real AI submit needs `XAI_API_KEY` and live Supabase.
- Artifact 7 hardening (season end freeze, reference reveal) not in scope.
- ESLint `react-hooks/set-state-in-effect` fires on data-fetch effects (same pattern as SoloHub).
