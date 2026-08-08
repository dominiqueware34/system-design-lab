# Product

> Stable document. Change only for positioning pivots or new primary modes.

## One-liner

**System Design Lab** is a **system design teaching game**: learn architectures on a drag-and-drop canvas, then **compete in the campaign**—clear levels, survive production **wrenches**, and chase high scores. **SpaceXAI (Grok)** is the interviewer and the chaos engine.

Not a static whiteboard PDF. Not pure free-form sandbox without stakes. **Learn → play → climb.**

## High-level concept

```
  LEARN                         PLAY / COMPETE
  ─────────────────────         ──────────────────────────────
  Training + guided builds  →   Campaign map (levels + wrenches)
  Free practice problems    →   Scores, stars, unlocks
  Building blocks (cache,       Future: 3-day seasons /
  queue, DB, …)                leaderboards (highest scores win)
```

| Pillar | What it means |
| --- | --- |
| **Subject** | Classic system design first (distributed systems); agentic AI as a second track |
| **Teaching** | Canvas + training + guided builds + AI Socratic feedback |
| **Game** | Campaign map, unlocks, wrenches (incidents), stars/progress |
| **Competition (future)** | Timed campaign seasons (~3 days) ranked by score—not shipped yet |

## Audience

- Engineers preparing for **system design interviews** who learn better by building than reading
- People who want **game-like progression** (levels, pressure, scores) around real architecture skills
- Secondary: agentic / LLM application architecture practice

## Product modes

| Mode | Route | Role in the loop |
| --- | --- | --- |
| **Training** | `/training`, `/training/[lessonId]` | **Learn** — building blocks (cache, CDN, replicas, queues, …) |
| **Guided builds** | `/training/guided/[buildId]` | **Learn** — step-by-step reference architectures + data-flow |
| **Free practice** | `/` → `/design/[problemId]` | **Practice** — full problems, AI score, no map unlock pressure |
| **Campaign** | `/campaign` | **Play / compete** — progressive levels, unlocks, wrench drills, stars |

## AI role

- **Evaluate** (`POST /api/evaluate`) — scores tradeoffs, scale, failure modes; Socratic follow-ups (teaching + score fuel)
- **Wrench** (`POST /api/wrench`) — production incident against the graph (campaign stakes / “game pressure”)
- Model: Vercel AI SDK + `@ai-sdk/xai` → SpaceXAI **`grok-4.5`** (`XAI_API_KEY` server-side)

## Tracks

| Track | Focus | Priority |
| --- | --- | --- |
| **Classic systems** | Hashing, sharding, scale, DBs, caches, queues, multi-region | Primary teaching content |
| Agentic AI | Models, RAG, tools, multi-agent, evals | Secondary track in the same game loop |

## Auth & progress (product behavior)

- Guests play fully; progress always in **localStorage**
- Signed-in users (Google via Supabase): **cloud sync** for campaign + training; merge-on-login
- Auth is soft today; competitive seasons will likely need durable identity (see Future)

## Future (not shipped — do not implement as if live)

| Idea | Intent | Status |
| --- | --- | --- |
| **3-day campaign seasons** | Time-boxed events; players compete for **highest scores** over ~3 days | Planned vision only |
| Leaderboards / ranking | Season standings, maybe friends or global | Depends on seasons + auth |
| Anti-cheat / score integrity | Server-side validation of campaign scores | Not started |

Agents: list these under BOARD **PLANNED** only; never claim they exist in FEATURES until built.

## Non-product (docs only)

- Marketing plans: `docs/marketing/*`
- Market research: `docs/market-research-viability.md`
- PR drafts: `docs/pr-drafts/*`

## Success signals

- Learners move Training → Practice → Campaign without feeling lost
- Campaign feels like a **game with system design depth** (not trivia)
- AI feedback improves designs between attempts
- Progress resumes when signed in
- (Later) Season participation and score competition drive return visits
- Coding agents do not reimplement shipped surfaces or invent seasons as live
