# Shipped Features (main)

> Last verified: 2026-08-10 · Artifact 7 reduced API (season freeze + ref reveal) on `feat/campaign-season-end` (#10)  
> Rule: if it is not listed here, treat it as **NOT shipped** unless STATUS Active work names it in-flight.

## Product surfaces

| Feature | Routes / entry | Key files | Notes |
| --- | --- | --- | --- |
| Primary app nav | all main surfaces | `src/components/nav/AppNav.tsx`, `src/app/layout.tsx` | Tabs: **Training \| Solo Mode \| Campaign \| Practice**; hidden on `/design/*` |
| Mode hub | `/` | `src/app/page.tsx` | Four mode cards (Training, Solo, Campaign, Practice) — not the practice list |
| Free practice picker | `/practice` | `src/app/practice/page.tsx`, `src/components/practice/ProblemPicker.tsx`, `src/lib/problems.ts` | 16 problems (10 classic + 6 agentic); moved from `/` |
| Component catalog | palette on canvas | `src/lib/component-catalog.ts` | 54 types · 13 categories |
| Design canvas | `/design/[problemId]` | `src/components/canvas/*` | React Flow; attributes; evaluation panel |
| Evaluation API | `POST /api/evaluate` | `src/app/api/evaluate/route.ts`, `src/lib/ai.ts`, `src/lib/evaluation-schema.ts`, `src/lib/serialize-design.ts` | SpaceXAI `grok-4.5` |
| Solo Mode | `/solo` · design via `?solo=solo-l1\|solo-l2` | `src/app/solo/page.tsx`, `src/components/solo/SoloHub.tsx`, `src/lib/solo-levels.ts`, `src/app/api/solo/levels/route.ts`, `src/app/api/problems/*`, `src/app/api/progress/solo/route.ts` | **2 multi-problem levels** (`solo-l1` Foundations ~10 classic, `solo-l2` Agentic ~6); L2 locked until L1 complete; **no wrenches**; pass ≥ passScore → bestScore/stars/**durationMs**; content APIs constant-backed |
| Campaign seasons MVP (UI) | `/campaign` · `/campaign/play/[promptId]` · `/campaign/leaderboard` · `/campaign/stats` | `src/app/campaign/**`, `src/components/campaign/CampaignHub.tsx`, `CampaignPlayClient.tsx`, `CampaignLeaderboard.tsx`, `CampaignMyStats.tsx`, `src/lib/campaign-client.ts`, `DesignWorkspace` `mode: "campaign"` | Artifact 6 (#12): guest pitch + Google; signed-in season hub (timer, N/20, play, LB); auth gate on play; submit only `POST /api/campaign/submit`; max 3 attempts; **no wrenches**; public LB (rank, name, season_score, stars, prompts — **no time**); my stats private durations via `/me`. Depends on Artifact 5 APIs. |
| Wrench API | `POST /api/wrench` | `src/app/api/wrench/route.ts`, `src/lib/wrench-schema.ts` | AI incidents on **legacy** map path (`?campaign=w*`) only — not Solo multi-problem |
| Training lessons | `/training`, `/training/[lessonId]` | `src/lib/training-lessons.ts`, `src/components/training/TrainingWorkspace.tsx` | 16 lessons |
| Guided builds | `/training/guided/[buildId]` | `src/lib/guided-builds.ts`, `src/components/training/GuidedBuildWorkspace.tsx` | 5 builds |
| Data-flow playback | canvas / guided | `src/components/flow/DataFlowPlayer.tsx`, `src/lib/flow-scenarios.ts`, `src/lib/flow-types.ts` | P0/P1 shipped; see `docs/specs/animated-data-flow.md` |
| Auth + session | `/auth/callback` | `src/lib/supabase/*`, `src/proxy.ts`, `src/components/auth/*`, `src/lib/auth-client.ts` | Google OAuth via Supabase SSR |
| Progress dual model | `/api/progress/solo`, `/api/progress/campaign`, `/api/progress/training`, `/api/progress/merge` | `src/lib/progress-sync.ts`, `src/lib/progress-merge.ts`, `src/lib/progress-db.ts`, migrations | localStorage **always** (`sdl-solo-progress-v1`, `sdl-campaign-progress-v1`, `sdl-training-progress-v1`) + Supabase when signed in; Solo merge-on-login |
| Marketing / research | docs only | `docs/marketing/*`, `docs/market-research-viability.md` | Not runtime |
| Campaign season prompt pack (offline) | fixture only (no UI) | `fixtures/campaign/season-prompts-v1.json`, `src/lib/catalog-schema.ts`, `src/lib/design-graph-validate.ts`, `src/lib/campaign-prompt-schema.ts`, `scripts/generate-season-prompts.ts` | Artifact 3: **20** pre-gen prompts + reference designs; operator docs `docs/specs/campaign-prompt-generation.md`. Not competitive season UI. |
| Campaign seasons DB (schema) | migrations + seed only (no UI) | `supabase/migrations/20260809120000_profiles.sql`, `…20100_campaign_seasons_and_prompts.sql`, `…20200_campaign_play_tables.sql`, `scripts/seed-season.ts` | Artifact 4 (#14): `profiles`, `campaign_seasons`, `campaign_prompts` (+ public view), `campaign_prompt_sessions`, `campaign_attempts`, `campaign_season_scores`, `campaign_leaderboard`. RLS: no client writes to scores/attempts; `reference_design` column-revoked for JWT. Seed: `npm run seed:season`. |
| Campaign submit API + scoring | `/api/campaign/*` | `src/lib/campaign-scoring.ts`, `src/lib/campaign-db.ts`, `src/lib/campaign-evaluate.ts`, `src/lib/supabase/admin.ts`, `src/app/api/campaign/**` | Artifact 5 (#17): server-authoritative `v1_correct_diff_cover`; max 3 attempts; sticky `started_at`; private `duration_ms`; LB has no times. Endpoints: `GET …/seasons/current` (any), `GET …/seasons/:id/prompts` (auth, strip ref while live), `POST …/prompts/:promptId/start` (auth), `POST …/submit` (auth), `GET …/leaderboard` (any, no times), `GET …/me` (auth, private durations). UI: Artifact 6. |
| Campaign season freeze + ref reveal (API) | campaign APIs | `src/lib/campaign-season-status.ts`, `campaign-db` (read-only effective status), start/submit freeze, `GET …/seasons/:id/prompts` | Artifact 7 **reduced** (#10): pure effective status from `ends_at`/`starts_at`; freezes **start + submit** when not live; `referenceDesign` on GET prompts **only when effectively ended**. No hub UI change. DB status persistence / Cron+Edge Function → `docs/specs/background-jobs.md` (planning). **Not** rate limits (#25) or next-season seed (#26). |

### Deep links (design canvas)

| Query / route | Behavior |
| --- | --- |
| `?solo=solo-l1` or `?solo=solo-l2` | Multi-problem Solo Mode (problem must be in that level); evaluate API; no wrenches; back → `/solo` |
| `?campaign=<legacyLevelId>` | Legacy 15-level map path with wrenches (`w1-l1` …) |
| `/campaign/play/[promptId]` | Competitive season play; `DesignWorkspace` `mode: "campaign"` → `POST /api/campaign/submit` only; **no wrenches**; auth required; back → `/campaign` |
| (none on `/design/…`) | Free practice; back link → `/practice` |

## Progress storage detail

| Store | Identifiers | Behavior |
| --- | --- | --- |
| localStorage | `sdl-solo-progress-v1`, `sdl-campaign-progress-v1`, `sdl-training-progress-v1` | Always written (`src/lib/solo-levels.ts`, `src/lib/campaign.ts`, `src/lib/training-lessons.ts`) |
| Supabase | `solo_progress`, `campaign_progress`, `training_progress` | RLS own-row; `20260327120000_progress_tables.sql` + `20260809120300_solo_progress.sql` |
| Supabase (Campaign seasons) | `profiles`, `campaign_seasons`, `campaign_prompts`, `campaign_prompt_sessions`, `campaign_attempts`, `campaign_season_scores` | Schema/RLS Artifact 4; **Artifact 5** service-role writes attempts/scores via submit API. Seed from fixture via `scripts/seed-season.ts`. |
| Merge | `POST /api/progress/merge` | On login: union local+remote for campaign + training + solo; hydrate localStorage |

## Stack (shipped)

| Piece | Version / choice |
| --- | --- |
| Next.js | `16.3.0` App Router |
| React | `19.2.8` |
| UI | Tailwind 4, Lucide icons |
| Canvas | `@xyflow/react` |
| AI | `ai` (Vercel AI SDK) + `@ai-sdk/xai` → `grok-4.5` |
| Auth/data | `@supabase/ssr`, `@supabase/supabase-js` |

### Env vars

| Var | Where | Notes |
| --- | --- | --- |
| `XAI_API_KEY` | server only | SpaceXAI; never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Prefer publishable; anon alias OK |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Required for Campaign submit/LB APIs (Artifact 5) + `npm run seed:season`; not required for user-scoped progress APIs |

Setup: `.env.example`, `docs/setup-auth.md`.

## Problem catalog (IDs) — 16 total

**Classic (10):** `url-shortener`, `distributed-kv`, `rate-limiter-service`, `chat-system`, `news-feed`, `global-id-generator`, `ride-sharing`, `video-streaming`, `payment-system`, `multi-tenant-saas-db`

**Agentic (6):** `rag-support-agent`, `research-agent-web`, `parallel-research-team`, `coding-agent-pr`, `enterprise-agent-platform`, `eval-driven-agent-improvement`

Source: `src/lib/problems.ts`.

## Solo Mode levels (multi-problem) — 2 levels

| Level id | Title | Problems | Unlock |
| --- | --- | --- | --- |
| `solo-l1` | Foundations | ~10 classic problem IDs | Always open |
| `solo-l2` | Agentic Frontier | ~6 agentic problem IDs | All of L1 complete |

Source: `src/lib/solo-levels.ts` (`SOLO_LEVELS`). Content APIs: `GET /api/solo/levels`, `GET /api/problems`, `GET /api/problems/[id]`. Per-problem progress: bestScore, stars, durationMs (first qualifying finish). Completing one problem ≠ completing the level.

Legacy 15-level map data remains in `src/lib/campaign.ts` for optional `?campaign=` wrench path only.

## Not shipped yet (do not invent as live)

- Campaign hardening: season end freeze, reference reveal (Artifact 7 / #10)
- Plan B constraint engine (parked)

## Training lesson IDs — 16 total

`add-cache`, `add-cdn`, `add-load-balancer`, `add-read-replicas`, `add-sharding`, `add-rate-limiter`, `add-multi-az-lb`, `add-replica-failover`, `add-queue`, `add-worker`, `add-dlq`, `add-rag`, `add-hybrid-rag-hint`, `add-web-search`, `add-tool-loop`, `add-evals`

Source: `src/lib/training-lessons.ts`.

## Guided build IDs — 5 total

`url-shortener-core`, `async-email-pipeline`, `read-heavy-scale`, `rag-support-bot`, `ha-multi-az`

Source: `src/lib/guided-builds.ts`.

## Component catalog

- File: `src/lib/component-catalog.ts` (**54** component types)
- Categories: `client`, `edge`, `compute`, `data`, `messaging`, `security`, `observability`, `storage`, `agent`, `tools`, `memory`, `orchestration`, `evals`

## Explicitly out of product (docs only)

- `docs/marketing/*`
- `docs/market-research-viability.md`
- `docs/pr-drafts/*`
- Design/planning: `docs/specs/application-brain.md` (this brain’s design)

## Deep specs (link, don’t copy)

| Topic | Path |
| --- | --- |
| Auth setup | `docs/setup-auth.md` |
| Google auth | `docs/specs/google-auth.md` |
| Animated data flow | `docs/specs/animated-data-flow.md` |
| Application brain design | `docs/specs/application-brain.md` |
| Solo Mode vs Campaign seasons (roadmap + scoring) | `docs/specs/solo-vs-campaign.md` — Solo multi-problem shipped (#11); competitive seasons still not runtime |
| Save-game progress (vscode draft) | `.vscode/specs/save-game-progress.md` |

## Merged history (do not re-ship)

PRs **#1–#7** on `main` (as of 2026-08-08): Supabase auth P0, map flavor, marketing docs, campaign/training/wrench, Google UI + progress sync, animated data-flow.
