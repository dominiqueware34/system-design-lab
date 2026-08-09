# Shipped Features (main)

> Last verified: 2026-08-09 · Artifact 1 nav/routes on `feat/app-nav-mode-shells` (#16)  
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
| Solo Mode map | `/solo` | `src/app/solo/page.tsx`, `src/lib/campaign.ts`, `src/components/campaign/*` | Temporary 15-level personal map (legacy progression); deep links prefer `?solo=` |
| Campaign shell | `/campaign` | `src/app/campaign/page.tsx` | Pitch + Google CTA (guests); signed-in season placeholder — **not** the old map; competitive seasons not runtime yet |
| Wrench API | `POST /api/wrench` | `src/app/api/wrench/route.ts`, `src/lib/wrench-schema.ts` | AI incidents on Solo map deploy |
| Training lessons | `/training`, `/training/[lessonId]` | `src/lib/training-lessons.ts`, `src/components/training/TrainingWorkspace.tsx` | 16 lessons |
| Guided builds | `/training/guided/[buildId]` | `src/lib/guided-builds.ts`, `src/components/training/GuidedBuildWorkspace.tsx` | 5 builds |
| Data-flow playback | canvas / guided / solo map | `src/components/flow/DataFlowPlayer.tsx`, `src/lib/flow-scenarios.ts`, `src/lib/flow-types.ts` | P0/P1 shipped; see `docs/specs/animated-data-flow.md` |
| Auth + session | `/auth/callback` | `src/lib/supabase/*`, `src/proxy.ts`, `src/components/auth/*`, `src/lib/auth-client.ts` | Google OAuth via Supabase SSR |
| Progress dual model | `/api/progress/campaign`, `/api/progress/training`, `/api/progress/merge` | `src/lib/progress-sync.ts`, `src/lib/progress-merge.ts`, `src/lib/progress-db.ts`, migration SQL | localStorage **always** + Supabase when signed in (storage key still `sdl-campaign-progress-v1` for Solo map) |
| Marketing / research | docs only | `docs/marketing/*`, `docs/market-research-viability.md` | Not runtime |
| Campaign season prompt pack (offline) | fixture only (no UI) | `fixtures/campaign/season-prompts-v1.json`, `src/lib/catalog-schema.ts`, `src/lib/design-graph-validate.ts`, `src/lib/campaign-prompt-schema.ts`, `scripts/generate-season-prompts.ts` | Artifact 3: **20** pre-gen prompts + reference designs; operator docs `docs/specs/campaign-prompt-generation.md`. Not competitive season UI. |

### Deep links (design canvas)

| Query | Behavior |
| --- | --- |
| `?solo=<levelId>` | Preferred Solo map level entry (must match problem) |
| `?campaign=<levelId>` | Legacy alias for the same Solo map level |
| (none) | Free practice; back link → `/practice` |

Solo map back links / post-clear → `/solo`.

## Progress storage detail

| Store | Identifiers | Behavior |
| --- | --- | --- |
| localStorage | `sdl-campaign-progress-v1`, `sdl-training-progress-v1` | Always written (`src/lib/campaign.ts`, `src/lib/training-lessons.ts`) |
| Supabase | `campaign_progress`, `training_progress` | RLS own-row; `supabase/migrations/20260327120000_progress_tables.sql` |
| Merge | `POST /api/progress/merge` | On login: union local+remote; hydrate localStorage |

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
| `SUPABASE_SERVICE_ROLE_KEY` | server optional | Not required for user-scoped progress APIs |

Setup: `.env.example`, `docs/setup-auth.md`.

## Problem catalog (IDs) — 16 total

**Classic (10):** `url-shortener`, `distributed-kv`, `rate-limiter-service`, `chat-system`, `news-feed`, `global-id-generator`, `ride-sharing`, `video-streaming`, `payment-system`, `multi-tenant-saas-db`

**Agentic (6):** `rag-support-agent`, `research-agent-web`, `parallel-research-team`, `coding-agent-pr`, `enterprise-agent-platform`, `eval-driven-agent-improvement`

Source: `src/lib/problems.ts`.

## Solo map levels (legacy progression) — 15 total / 4 worlds

Played at **`/solo`** (not `/campaign`). Level IDs: `w1-l1` … `w1-l3`, `w2-l1` … `w2-l4`, `w3-l1` … `w3-l3`, `w4-l1` … `w4-l5`.

Source: `src/lib/campaign.ts` (`CAMPAIGN_LEVELS`, unlock edges, world names / flavor). Progress storage ids still use “campaign” naming until Solo multi-problem (#11) lands.

## Not shipped yet (do not invent as live)

- Solo multi-problem levels (Artifact 2 / #11)
- Competitive Campaign seasons, leaderboard, submit scoring `v1_correct_diff_cover` (Artifacts 3–7)
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
| Solo Mode vs Campaign seasons (roadmap + scoring) | `docs/specs/solo-vs-campaign.md` — nav shells + Solo map port shipped (#16); multi-problem Solo + competitive seasons still not runtime |
| Save-game progress (vscode draft) | `.vscode/specs/save-game-progress.md` |

## Merged history (do not re-ship)

PRs **#1–#7** on `main` (as of 2026-08-08): Supabase auth P0, map flavor, marketing docs, campaign/training/wrench, Google UI + progress sync, animated data-flow.
