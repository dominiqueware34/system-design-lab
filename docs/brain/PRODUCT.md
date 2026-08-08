# Product

> Stable document. Change only for positioning pivots or new primary modes.

## One-liner

Practice **classic distributed systems** and **agentic AI workflows** on a drag-and-drop canvas. Deploy designs into a campaign map; **SpaceXAI (Grok)** scores architectures and throws production **wrenches** (incidents) you must fix to unlock the next path.

## Audience

- Engineers prepping for system design and agentic-architecture interviews
- Learners who want interactive architecture practice (not slide decks alone)

## Product modes

| Mode | Route | Role |
| --- | --- | --- |
| **Campaign (primary)** | `/campaign` | Zelda-style map of levels; unlock graph; AI wrenches on deploy |
| Free practice | `/` → `/design/[problemId]` | Filter classic / agentic problems; score with no map unlock |
| Training | `/training`, `/training/[lessonId]` | Bare-bones systems + placement tips |
| Guided builds | `/training/guided/[buildId]` | Step-by-step architecture builds with data-flow playback |

## AI role

- **Evaluate** designs (`POST /api/evaluate`) — score, failure modes, Socratic follow-ups, eval gaps
- **Wrench** (`POST /api/wrench`) — invent a production incident against the submitted graph
- Model path: Vercel AI SDK + `@ai-sdk/xai` → SpaceXAI **`grok-4.5`** (server-side `XAI_API_KEY`)

## Tracks

| Track | Focus |
| --- | --- |
| Classic systems | Hashing, sharding, scale, DBs, caches, queues, multi-region |
| Agentic AI | Model selection, RAG, tools, multi-agent, tool→LLM loops, span & e2e evals |

## Auth & progress (product behavior)

- Guests play fully; progress is always in **localStorage**
- Signed-in users (Google via Supabase) get **cloud sync** for campaign + training progress, with merge-on-login so stars/completions are not lost
- Auth is soft: not a hard gate on free play

## Non-product (docs only)

- Marketing plans: `docs/marketing/*`
- Market research: `docs/market-research-viability.md`
- PR drafts: `docs/pr-drafts/*`

These are not runtime features. Do not build product code from them unless STATUS says so.

## Success signals

- Players complete campaign levels under wrench pressure
- Designs improve after incident-driven iteration
- Progress resumes across devices when signed in
- Agents (coding LLMs) do not reimplement shipped surfaces
