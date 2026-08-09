# Product

> Stable document. Change only for positioning pivots or new primary modes.  
> Mode vocabulary SSOT for agents: this file + deep spec `docs/specs/solo-vs-campaign.md` (Artifact 0 / #13).

## One-liner

**System Design Lab** is a **system design teaching game**: learn architectures on a drag-and-drop canvas, then **play Solo Mode** for personal multi-problem levels and **compete in Campaign** seasons for leaderboard rank. **SpaceXAI (Grok)** is the interviewer and scorer.

Not a static whiteboard PDF. Not pure free-form sandbox without stakes. **Learn → practice → Solo → Campaign.**

## High-level concept

```
  LEARN                         PRACTICE                    PLAY
  ─────────────────────         ───────────────────         ──────────────────────────────
  Training + guided builds  →   Free practice problems  →   Solo Mode (personal levels)
  Building blocks               (no map / season pressure)  Campaign (3-day seasons + LB)
```

| Pillar | What it means |
| --- | --- |
| **Subject** | Classic system design first (distributed systems); agentic AI as a second track |
| **Teaching** | Canvas + training + guided builds + AI Socratic feedback |
| **Play (Solo)** | Personal multi-problem levels; progress and stars without public ranking |
| **Compete (Campaign)** | Timed **3-day seasons**, shared prompt set, leaderboard by season score |
| **Practice** | Full problems on the canvas without Solo unlocks or Campaign season rules |

## Audience

- Engineers preparing for **system design interviews** who learn better by building than reading
- People who want **game-like progression** (levels, pressure, scores) around real architecture skills
- Secondary: agentic / LLM application architecture practice

## Product modes

Primary vocabulary. **Do not** call the personal progression path “Campaign” once Solo Mode ships; **do not** treat the legacy map+wrenches loop as the competitive season product.

| Mode | Route (target) | Role in the loop | Shipped today? |
| --- | --- | --- | --- |
| **Training** | `/training`, `/training/[lessonId]`, guided under `/training/guided/…` | **Learn** — building blocks and step-by-step architectures | **Yes** |
| **Practice** | Hub `/` → design; target picker **`/practice`** | **Practice** — full problems, AI score, no Solo unlocks / no season rules | **Yes** (picker still on `/`; `/practice` is Artifact 1) |
| **Solo Mode** | **`/solo`** | **Play** — personal multi-problem levels, duration/progress, stars | **No** (roadmap Artifacts 1–2; #16, #11) |
| **Campaign** | **`/campaign`** | **Compete** — 3-day seasons, attempts limits, private timer, public leaderboard | **Partial rename collision** — shipped surface is a **solo progress map + wrenches** (pre mode-split). Competitive seasons **not** shipped |

### Solo Mode vs Campaign (agents must not confuse these)

| | **Solo Mode** | **Campaign** (competitive) |
| --- | --- | --- |
| **Purpose** | Personal multi-problem progression | Time-boxed competition vs other players |
| **Route** | `/solo` | `/campaign` |
| **Content** | Curated levels (v1: **2** multi-problem levels) | Pre-generated season prompt set (v1: **20** prompts) |
| **Ranking** | None (personal progress / stars) | Season **leaderboard** by `season_score` |
| **Auth** | Guests OK; sync when signed in (same dual progress model) | **Google sign-in required** to play / submit |
| **Timer** | Level/duration UX as designed for Solo | Sticky timer; **time is private** (not on public LB) |
| **Attempts** | Solo progression rules (not season 3-attempt lock) | **Max 3 attempts per prompt** |
| **Wrenches** | **None in v1** | **None in v1** (legacy map wrenches ≠ season product) |
| **References** | Teaching/reference material as appropriate | **Hidden until season ends** |
| **Scoring** | Stars / level completion (Solo-specific) | Formula id **`v1_correct_diff_cover`** (see spec) |

Deep lock-ins, scoring math, nav, and artifact map: **`docs/specs/solo-vs-campaign.md`**.

### Target primary nav

`Training | Solo Mode | Campaign | Practice`  
Hub remains `/`. Practice picker migrates to `/practice` when Artifact 1 lands.

## AI role

- **Evaluate** (`POST /api/evaluate`) — scores tradeoffs, scale, failure modes; Socratic follow-ups (teaching + score fuel for Practice / Solo / Campaign)
- **Wrench** (`POST /api/wrench`) — production incident against the graph (**legacy campaign map** stakes). **Not** part of Solo Mode or competitive Campaign **v1**
- Model: Vercel AI SDK + `@ai-sdk/xai` → SpaceXAI **`grok-4.5`** (`XAI_API_KEY` server-side)

## Tracks

| Track | Focus | Priority |
| --- | --- | --- |
| **Classic systems** | Hashing, sharding, scale, DBs, caches, queues, multi-region | Primary teaching content |
| Agentic AI | Models, RAG, tools, multi-agent, evals | Secondary track in the same game loop |

## Auth & progress (product behavior)

- Guests play Training / Practice / (future) Solo fully; progress always in **localStorage**
- Signed-in users (Google via Supabase): **cloud sync** for campaign map + training progress today; Solo/Campaign season stores when those modes ship
- **Competitive Campaign play requires Google sign-in** (durable identity for leaderboard integrity)

## Future / roadmap (not shipped — do not implement as if live)

| Idea | Intent | Status |
| --- | --- | --- |
| **Solo Mode** (`/solo`) | Personal multi-problem levels (v1: 2 levels) | Planned — Artifacts 1–2 (#16, #11) |
| **Campaign seasons** (3-day) | Shared 20-prompt set; leaderboard; scoring `v1_correct_diff_cover` | Planned — Artifacts 3–7 (#15, #14, #17, #12, #10) |
| Practice at `/practice` | Dedicated practice route; hub stays `/` | Planned — Artifact 1 (#16) |
| Content APIs over constants | Serve Solo/Campaign content from APIs, not only TS constants | Planned with content artifacts |
| **Plan B (constraint engine)** | Alternate evaluation path | **PARKED** — do not implement |

Agents: list under BOARD **PLANNED** / epic issues only; never claim seasons or Solo Mode exist in **FEATURES** until built.

## Non-product (docs only)

- Marketing plans: `docs/marketing/*`
- Market research: `docs/market-research-viability.md`
- PR drafts: `docs/pr-drafts/*`
- Mode split deep spec: `docs/specs/solo-vs-campaign.md`

## Success signals

- Learners move Training → Practice → Solo → Campaign without vocabulary confusion
- Solo feels like a **personal game path**; Campaign feels like a **fair timed competition**
- AI feedback improves designs between attempts
- Progress resumes when signed in
- Season participation and score competition drive return visits (when shipped)
- Coding agents do not reimplement shipped surfaces, invent seasons as live, or start Plan B
