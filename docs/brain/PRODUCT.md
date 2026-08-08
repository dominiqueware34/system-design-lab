# Product

> Stable document. Change only for positioning pivots or new primary modes.

## One-liner

**System Design Lab** is a hands-on system design practice lab: drag components onto a canvas, wire real architectures (load balancers, caches, queues, DBs, multi-region, …), and get interviewed by **SpaceXAI (Grok)** on scale, bottlenecks, and failure modes—not another static whiteboard PDF.

Campaign mode adds progressive levels and production-incident drills so you defend the design under pressure. Agentic AI problems are a second track for modern agent stacks, not the core identity.

## Audience

- Engineers preparing for **system design interviews** (classic distributed systems first)
- Learners who want interactive architecture practice (canvas + feedback, not slide decks alone)
- Secondary: people designing agentic / LLM application architectures

## Product modes

| Mode | Route | Role |
| --- | --- | --- |
| Free practice | `/` → `/design/[problemId]` | Classic + agentic design problems; full canvas; AI score + Socratic follow-ups |
| **Campaign** | `/campaign` | Structured path of system design levels; unlock graph; optional AI incident drills on deploy |
| Training | `/training`, `/training/[lessonId]` | Building blocks (cache, CDN, replicas, queues, …) with placement tips |
| Guided builds | `/training/guided/[buildId]` | Step-by-step reference architectures with data-flow playback |

## AI role

- **Evaluate** designs (`POST /api/evaluate`) — score tradeoffs, scale, failure modes, Socratic follow-ups
- **Wrench** (`POST /api/wrench`) — production-incident drill against the graph (campaign pressure, not the product pitch)
- Model path: Vercel AI SDK + `@ai-sdk/xai` → SpaceXAI **`grok-4.5`** (server-side `XAI_API_KEY`)

## Tracks

| Track | Focus | Priority |
| --- | --- | --- |
| **Classic systems** | Hashing, sharding, scale, DBs, caches, queues, multi-region | Primary |
| Agentic AI | Model selection, RAG, tools, multi-agent, tool→LLM loops, span & e2e evals | Secondary track |

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

- Users can explain and improve a system design after canvas practice + AI feedback
- Classic problem coverage feels interview-relevant (URL shortener → global systems)
- Campaign completion and incident drills improve resilience thinking
- Progress resumes across devices when signed in
- Coding agents do not reimplement shipped surfaces
