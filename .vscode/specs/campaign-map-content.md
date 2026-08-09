# Campaign Map Content Spec — System Design Lab

**Status:** Brainstorm / Draft  
**Owner:** Product / Content  
**Map surface:** `/campaign` · `CampaignMap.tsx` · `src/lib/campaign.ts`  
**Campaign title (current):** The Architecture Trail  

---

## A. Goals for map contentfulness

Today the map is a clean path of **problem titles dressed as stop names** (Tiny Links, Gatekeeper, Hash Ring…). That works as a curriculum index. It does **not** feel like a place you remember a week later.

### Why thematic naming wins

| Dry title | Thematic stop | What sticks |
|-----------|---------------|-------------|
| News Feed at Scale | **Feed Frenzy** | You designed under traffic panic, not “module 2.3” |
| Distributed KV | **Hash Ring** (keep) / **Shard Spire** | Place identity = skill identity |
| Video Streaming | **Media Forge** (compound) | Story of image → video → CDN is one saga |

Interview prep fails when learners remember *topics* but not *failure modes*. Named places force narrative: “I died at Scaling Madness because I never put a queue in front of the workers.” That sentence is portable into real interviews.

### Why multi-system levels win

Real senior interviews rarely stop at one box diagram. They chain:

1. Design the core service  
2. “Now 10× traffic hits — what breaks?”  
3. “Add media / payments / agents — how do the systems couple?”

A single map stop that runs **one or more systems** (sequential or compound) trains that muscle without fragmenting the map into 40 tiny dots. Wrenches become chapter bosses of a place, not random pop quizzes.

### Success metrics (product)

- **Retention:** players can name 5+ stops and what skill each taught  
- **Session depth:** avg systems designed per session ↑ without completion rate collapsing  
- **Interview transfer:** post-session self-report “I would use this story in an interview” ≥ 70% on compound stops  
- **Map delight:** qualitative — “this feels like a game world, not a checklist”

---

## B. Content design pillars

### 1. Place identity

Every stop earns three assets:

| Asset | Rule | Example |
|-------|------|---------|
| **mapLabel** | 1–3 words, gamey, not a textbook title | Scaling Madness |
| **tagline** | One punchy line under the name | “Traffic just found you.” |
| **lore** | 1–3 sentences of fiction-adjacent setup | The frontier city only has one gateway. Every bot in the hemisphere is hammering it. |
| **visual motif** | Color / icon / terrain hint for art later | Amber heat haze, overloaded meters |

Place identity is **orthogonal** to problem difficulty. A hard problem can live in a cozy name; a medium problem can live in a terrifying one. Prefer names that encode *stakes*, not *algorithms*.

### 2. Curriculum progression (skills unlock, not just difficulty++)

Worlds teach **skill families**. Completing a stop unlocks *mental models*, not only the next node.

| World focus | Skills unlocked (examples) |
|-------------|----------------------------|
| Foundations | caching, rate limits, hashing, basic availability |
| Scale Out | fan-out, geo, IDs, realtime, queues |
| Data Deep | consistency, multi-tenant, ledgers, pipelines |
| Agentic Frontier | RAG, tools, multi-agent, eval loops |
| Endgame | cross-cutting platforms, global media, agent OS |

Optional: soft gates — e.g. “Consistency Crisis” recommends completing Cache Canyon first, even if not hard-locked.

### 3. Compound challenges (multi-system stops)

A **stop** is a map node. A **system** is one design problem (or phase) inside that stop.

```
Stop: Media Forge
  ├─ System A (primary): Image processing pipeline
  ├─ System B (escalation): Video transcoding at scale
  └─ Wrenches: themed around media/CDN/hot storage
```

Narrative glue: systems should feel like **one product evolving**, not random homework.

### 4. Wrench theming tied to place

Wrenches today invent production incidents. Content should bias generators with a **wrenchTheme** per system/stop:

| Place vibe | Wrench themes |
|------------|---------------|
| Scaling Madness | hot keys, queue backlog, autoscaler thrash, dependency timeouts |
| Cache Canyon | stampedes, stale reads, cold start, eviction storms |
| Consistency Crisis | split brain, dual-write drift, clock skew, partial commit |
| Agent Swarm | tool storms, runaway cost, poisoned RAG, agent deadlock |
| Eval Peak | silent regressions, gaming metrics, data leakage in evals |

If the place is about scale, do not throw a pure “XSS in admin UI” wrench unless it is a deliberate side quest.

### 5. Optional side paths / optional bosses

- **Side paths:** optional stops that award stars / cosmetics / harder wrenches without blocking main path  
- **Optional bosses:** compound multi-system stops that gate “true ending” or extra star tiers  
- **Forks:** later phases — e.g. after Scale Out, choose **Realtime Ridge** *or* **Data Deep** first

Keep main path clear for first-time players. Mark optional nodes distinctly on the map (dashed path, secondary color).

---

## C. Proposed data model changes

### Current model (as shipped)

```ts
// src/lib/types.ts — CampaignLevelNode (today)
interface CampaignLevelNode {
  id: string
  problemId: string           // single system
  mapLabel: string
  world: number
  worldName: string
  x: number
  y: number
  unlocksAfter: string[]
  wrenchCount: number
  passScore: number
  flavor?: string
}
```

Progress: `completedLevelIds`, `stars[levelId]`, `wrenchesSurvived`.

### Target conceptual model

```ts
// brainstorm shapes — not final code

type SystemRole = "primary" | "escalation" | "side"

type CampaignSystem = {
  id: string
  /** Existing DesignProblem.id, or future inline/generated problem */
  problemId: string
  title: string                 // "Image processing pipeline"
  role: SystemRole
  passScore?: number            // override stop default
  wrenchCount?: number
  wrenchTheme?: string          // "scale" | "latency" | "security" | "consistency" | "agent-cost" | ...
  /** Optional short setup shown between phases */
  bridgeLore?: string
}

type CampaignStop = {
  id: string
  mapLabel: string              // "Scaling Madness"
  tagline?: string
  world: number
  worldName: string
  lore?: string
  motif?: string                // art/theme key for UI
  systems: CampaignSystem[]     // 1+ systems per stop
  unlocksAfter: string[]        // stop ids
  optional?: boolean            // side path
  boss?: boolean                // optional or main boss flag
  // map placement
  x: number
  y: number
  // stop-level defaults (systems can override)
  passScore?: number
  wrenchCount?: number
}

// Progress evolves to track systems + stops
type CampaignProgressV2 = {
  completedStopIds: string[]
  completedSystemIds: string[]          // `${stopId}:${systemId}` or global system ids
  stars: Record<string, number>         // per stop and/or per system
  wrenchesSurvived: number
  lastPlayedStopId?: string
  lastPlayedSystemId?: string
}
```

### Migration: single `problemId` → multi-system

**Backward-compatible expand:**

```ts
// Migration rule for existing CAMPAIGN_LEVELS
function toStop(legacy: CampaignLevelNode): CampaignStop {
  return {
    id: legacy.id,
    mapLabel: legacy.mapLabel,
    world: legacy.world,
    worldName: legacy.worldName,
    lore: legacy.flavor,
    x: legacy.x,
    y: legacy.y,
    unlocksAfter: legacy.unlocksAfter,
    passScore: legacy.passScore,
    wrenchCount: legacy.wrenchCount,
    systems: [
      {
        id: "main",
        problemId: legacy.problemId,
        title: resolveProblemTitle(legacy.problemId),
        role: "primary",
        passScore: legacy.passScore,
        wrenchCount: legacy.wrenchCount,
      },
    ],
  }
}
```

| Concern | Approach |
|---------|----------|
| Storage key | Bump `sdl-campaign-progress-v1` → `v2`; migrate completed ids 1:1 |
| `campaignHref` | `/design/${problemId}?campaign=${stopId}&system=${systemId}` |
| Stars | Keep stop-level stars; optionally average/max system stars |
| Unlock rule (default) | All **primary + escalation** systems cleared → stop complete → unlocks dependents. `side` systems optional for stars |
| Map UI | One node per stop; multi-system shown in detail panel as phases |
| Content authoring | Prefer reusing `problems.ts` ids; new compound stops may need new problem entries |

### Naming convention

- **Stop id:** `w2-scaling-madness` (readable) or keep `w2-l3` during P0  
- **System id:** short local: `pipeline`, `transcode`, `cdn`  
- **Map labels:** Title Case, punchy, max ~18 chars for node chips  

---

## D. Large brainstorm catalog (≥20 named stops)

Worlds below use the **redesign names** from section F. Existing problems are remapped where possible; new problem themes are marked **(new)**.

### World 1 — The Threshold (Foundations)

| # | Map name | Systems (1–3) | Narrative glue | Sample wrench themes |
|---|----------|---------------|----------------|----------------------|
| 1 | **Tiny Links** | 1) URL shortener | First production deploy; learn request path + storage | hot short codes, redirect latency, cache miss storm |
| 2 | **Gatekeeper** | 1) Distributed rate limiter | City gate under bot siege | key cardinality explosion, Redis failover, clock skew windows |
| 3 | **Hash Ring** | 1) Distributed KV | You own the map of shards | rebalance storm, hot partition, inconsistent replica read |
| 4 | **Cache Canyon** *(optional / insert)* | 1) Multi-layer cache for read-heavy API **(new or KV-adjacent)** | Everyone caches; nobody invalidates | stampede, thundering herd, poison cache |

### World 2 — Scaling Frontier

| # | Map name | Systems | Narrative glue | Sample wrench themes |
|---|----------|---------|----------------|----------------------|
| 5 | **Live Wire** | 1) Real-time chat | Presence and messages at human speed | WS fan-out collapse, message reordering, online-status lag |
| 6 | **Snowflake Falls** | 1) Global ID generator | IDs must stay unique across continents | clock rollback, datacenter id collision, throughput cliff |
| 7 | **Feed Frenzy** | 1) News feed at scale 2) *(escalation)* Fan-out service under celebrity traffic **(new phase)** | One post, a million timelines | write fan-out backlog, celebrity hot key, ranking latency |
| 8 | **Geo Match** | 1) Ride-sharing matching | Space and cars on a live map | geo index overload, matching unfairness, surge race |
| 9 | **Scaling Madness** | 1) Horizontal scale for a spike-prone API **(new)** 2) *(escalation)* Queue + worker redesign under 10× | The traffic graph is vertical | autoscaler thrash, queue poison messages, dependency timeout cascade |
| 10 | **Queue Quake** *(side)* | 1) Job queue / async pipeline **(new)** | Aftershocks of Scaling Madness | dead-letter floods, exactly-once illusions, consumer lag |

### World 3 — Data Deep

| # | Map name | Systems | Narrative glue | Sample wrench themes |
|---|----------|---------|----------------|----------------------|
| 11 | **Consistency Crisis** | 1) Multi-region data with conflict rules **(new)** 2) *(escalation)* Dual-write migration rescue | Two truths enter; one leaves | split brain, read-your-writes broken, migration dual-write drift |
| 12 | **Tenant Tangle** | 1) Multi-tenant SaaS data platform | Isolation vs density | noisy neighbor, cross-tenant leak, backup restore blast radius |
| 13 | **Ledger Labyrinth** | 1) Payment processing platform 2) *(escalation)* Reconciliation / ledger audit path **(new phase)** | Money never “eventually” is fine | double charge, idempotency gap, reconciliation mismatch |
| 14 | **Pipeline Peak** *(side)* | 1) Batch + streaming analytics path **(new)** | Metrics that lie are worse than none | late data, watermark hell, dashboard lag |

### World 4 — Media Expanse

| # | Map name | Systems | Narrative glue | Sample wrench themes |
|---|----------|---------|----------------|----------------------|
| 15 | **Media Forge** | 1) Image processing pipeline **(new)** 2) Video transcoding / scaling **(new or video-adjacent)** 3) *(optional side)* CDN edge strategy | Pixels in, global audiences out | storage cost spike, transcode backlog, hot object origin pull |
| 16 | **Global Stream** | 1) Global video streaming | Live + VOD under world events | CDN miss storm, origin overload, bitrate ladder fail |
| 17 | **Thumbstack** *(optional boss lite)* | 1) Thumbnail + preview generation at upload time **(new)** | Media Forge’s little sibling | bursty upload storms, format zoo, virus-scan bottleneck |

### World 5 — Agentic Frontier

| # | Map name | Systems | Narrative glue | Sample wrench themes |
|---|----------|---------|----------------|----------------------|
| 18 | **RAG Ruins** | 1) RAG customer support agent | Knowledge is buried; tools dig | retrieval poison, stale docs, hallucination under empty hit |
| 19 | **Web Scout** | 1) Web research agent | Open web, closed SLAs | tool timeout storms, prompt injection via pages, cost runaway |
| 20 | **Agent Swarm** | 1) Parallel multi-agent research team 2) *(escalation)* Coordinator / critic agent under load | Many minds, one deadline | agent deadlock, duplicated work, shared-memory race |
| 21 | **Tool Tempest** *(side)* | 1) Tool-calling gateway with auth & budgets **(new)** | Weapons for agents need holsters | OAuth token leak, tool amplification attack, rate-limit flapping |

### World 6 — Endgame Spire

| # | Map name | Systems | Narrative glue | Sample wrench themes |
|---|----------|---------|----------------|----------------------|
| 22 | **Code Crucible** | 1) Coding agent for PRs 2) *(escalation)* Safe apply + rollback pipeline **(new phase)** | Ship code that ships code | malicious PR tool use, flaky test loops, secret exfil |
| 23 | **Agent OS** | 1) Enterprise agentic platform | Tenants, policies, runtime for all agents | policy bypass, noisy multi-tenant agents, audit gaps |
| 24 | **Eval Peak** | 1) Eval-driven agent improvement loop 2) *(boss escalation)* Continuous eval under prod drift | The final boss: measure everything | silent quality regression, metric gaming, train/test leak |
| 25 | **The Convergence** *(optional true ending)* | 1) Hybrid: human product + agent fleet + data plane **(new compound)** 2) Global reliability story | Classic + agentic collide | cascading failure across LLM + DB + queue |

### Spotlight write-ups (flagship stops)

#### Scaling Madness (World 2)

- **Tagline:** Traffic just found you.  
- **Lore:** A launch tweet went nuclear. Your API is the only door. Autoscalers are screaming; the on-call channel is a crime scene.  
- **Systems:**  
  1. **primary** — Design a spike-tolerant public API (load balancing, caching, backpressure)  
  2. **escalation** — Introduce async processing: queues, workers, DLQ, idempotency  
- **Why related:** Same product; phase 2 is what phase 1 inevitably becomes at 10×.  
- **Wrenches:** hot keys, queue backlog, dependency timeout cascade, thrashing HPA.

#### Media Forge (World 4)

- **Tagline:** Pixels enter. Platforms exit.  
- **Lore:** Creators upload chaos. Marketing wants thumbnails in 3s and 4K in 30. Storage finance wants a word.  
- **Systems:**  
  1. **primary** — Image processing pipeline (upload, virus scan, variants, metadata)  
  2. **escalation** — Video transcoding & adaptive bitrate prep  
  3. **side** — CDN / edge cache policy (optional stars)  
- **Why related:** Same media platform lifecycle; image teaches pipeline shape, video teaches cost/time/scale.  
- **Wrenches:** object storage cost spike, codec backlog, origin shield miss, corrupt media handling.

#### Agent Swarm (World 5)

- **Tagline:** One brain is a bottleneck.  
- **Systems:** parallel research agents → coordinator under contention.  
- **Wrenches:** deadlocks, cost explosions, conflicting agent conclusions.

#### Eval Peak (World 6)

- **Tagline:** If you can’t measure it, you can’t ship it.  
- **Systems:** eval loop + continuous regression under prod drift.  
- **Wrenches:** silent quality drop, gaming the judge model, leakage.

#### Consistency Crisis (World 3)

- **Tagline:** Two regions. Two truths.  
- **Systems:** multi-region consistency model → dual-write migration rescue.  
- **Wrenches:** split brain, lost updates, migration half-cutover.

#### Cache Canyon (World 1–2 bridge)

- **Tagline:** Everything is fast until it isn’t.  
- **Systems:** multi-layer caching for a read-heavy surface.  
- **Wrenches:** stampede, stale auth decisions, cold-start cliffs.

### Full name bank (extra / rename candidates)

Use freely for iterations: **Shard Spire, Redirect Reef, Token Tempest, Presence Plains, Timeline Torrent, Surge Spire, Idempotency Isle, Outbox Outpost, Watermark Wastes, Vector Vale, Prompt Precipice, Budget Bluff, Sandbox Summit, Policy Pass, Drift Dome, Chaos Causeway.**

### Mapping existing campaign nodes → new labels (P0)

| Current id | Current mapLabel | Proposed mapLabel | Notes |
|------------|------------------|-------------------|-------|
| w1-l1 | Tiny Links | Tiny Links | keep — already gamey |
| w1-l2 | Gatekeeper | Gatekeeper | keep |
| w1-l3 | Hash Ring | Hash Ring *or* Shard Spire | Hash Ring is strong |
| w2-l1 | Live Chat | Live Wire | more place-like |
| w2-l2 | Snowflake | Snowflake Falls | place energy |
| w2-l3 | The Feed | Feed Frenzy | stakes |
| w2-l4 | Geo Match | Geo Match | keep |
| w3-l1 | RAG Bot | RAG Ruins | place |
| w3-l2 | Web Scout | Web Scout | keep |
| w3-l3 | Swarm | Agent Swarm | clearer |
| w4-l1 | Code Agent | Code Crucible | place |
| w4-l2 | Ledger | Ledger Labyrinth | place + compound later |
| w4-l3 | Global Stream | Global Stream | keep |
| w4-l4 | Agent OS | Agent OS | keep |
| w4-l5 | Eval Peak | Eval Peak | keep — already peak |

---

## E. Level structure UX

### Two layout options

| Mode | How it plays | Pros | Cons |
|------|--------------|------|------|
| **A. Sequential phases (recommended default)** | One map node. Detail panel shows Phase 1 → Phase 2. Completing phase N unlocks phase N+1 in the design flow. | Clean map; strong narrative; easy progress | Long sessions per node |
| **B. Sub-nodes on map** | Compound stops expand into small satellite nodes | Visible structure | Map clutter; harder path curves |

**Recommendation:** Mode A for all compound stops; Mode B only if a compound has ≥3 systems *and* optional sides that should be skippable on the map.

### Progress rules (default)

1. Enter stop → land on first incomplete **primary/escalation** system.  
2. Design → evaluate → wrench loop per system (`wrenchCount` on system).  
3. System clear when score ≥ `passScore` after required wrenches.  
4. **Stop clear** when all `primary` + `escalation` systems clear.  
5. `side` systems: optional; award bonus stars / badge, do not block `unlocksAfter`.  
6. Stars:  
   - Per system: 1/2/3 from score margins (reuse current thresholds).  
   - Per stop: average rounded, or max of primaries, **or** sum capped — pick one in P1 (proposal: **max of primary systems**, +1 if all sides done).  

### Unlock graph

- Edges stay **stop → stop** via `unlocksAfter`.  
- Do not unlock next stop mid-compound (avoid soft-locking mental model).  
- Optional: allow “retreat” to map with partial system progress saved.

### Stop detail panel (UI mock)

```
┌─────────────────────────────────────────────┐
│  ⚡ SCALING MADNESS              W2 · Scale │
│  “Traffic just found you.”                  │
│                                             │
│  The frontier city only has one gateway…    │
│                                             │
│  Systems                                    │
│  ● 1. Spike-tolerant API      ★★☆  CLEARED  │
│  ○ 2. Queue & workers         —    NEXT     │
│  ◇ Side: Chaos drill          —    optional │
│                                             │
│  Wrenches survived here: 2                  │
│  Motif: heat / overload meters              │
│                                             │
│  [ Continue Phase 2 ]   [ View lore ]       │
└─────────────────────────────────────────────┘
```

Map node chip:

- Label: `Scaling Madness`  
- Badge: `2/2` systems or multi-star row  
- Boss ring if `boss: true`  
- Dashed ring if `optional: true`

### Design flow deep link

```
/design/{problemId}?campaign={stopId}&system={systemId}
```

On pass: advance to next system in stop, or return to map with stop complete.

---

## F. World redesign proposal

| # | Current | Proposed name | Identity | Color motif (keep palette spirit) |
|---|---------|---------------|----------|-----------------------------------|
| 1 | Foundations | **The Threshold** | First deploys, gates, hashes, caches | Emerald green |
| 2 | Scale Out | **Scaling Frontier** | Traffic, geo, realtime, queues | Sky blue |
| 3 | *(new split)* | **Data Deep** | Consistency, multi-tenant, money, pipelines | Teal / deep cyan |
| 4 | *(new)* | **Media Expanse** | Images, video, CDN, global stream | Magenta / rose |
| 5 | Agentic Awakening | **Agentic Frontier** | RAG, tools, swarms, tool governance | Violet |
| 6 | Endgame | **Endgame Spire** | Platforms, eval, convergence boss | Hot pink / gold accents |

### Lean alternative (if 6 worlds is too many for v1)

Keep **4 worlds** but rename hard:

1. **The Threshold** — foundations  
2. **The Edgelands** — scale + media (Live Wire → Global Stream)  
3. **Agentic Frontier** — agents  
4. **Endgame Spire** — payments, agent OS, eval peak  

Insert **Data Deep** stops into Edgelands mid-path if needed.

### World intro blurb examples

- **The Threshold:** “Every architect starts at the gate. Few leave with the keys.”  
- **Scaling Frontier:** “Horizontal is a direction, not a strategy — until it is.”  
- **Data Deep:** “Where truth is negotiated under latency.”  
- **Media Expanse:** “Bandwidth is the new battlefield.”  
- **Agentic Frontier:** “Tools that think. Costs that scream.”  
- **Endgame Spire:** “Platforms all the way down.”

### Path shape (narrative)

Linear spine with optional side loops:

```
Threshold → Scaling Frontier → Data Deep → Media Expanse
                ↘ side: Queue Quake
                              ↘ side: Pipeline Peak
→ Agentic Frontier → Endgame Spire → (optional) The Convergence
```

---

## G. Implementation phases

### P0 — Rename / flavor only (no schema break)

**Goal:** Map feels contentful *this week*.

- Rewrite `mapLabel` + expand `flavor` → treat as lore/tagline  
- Optional: add `tagline` field if cheap; else pack into `flavor`  
- World renames in `worldName`  
- Copy-only PR: `campaign.ts` + detail panel strings  
- **No** multi-system yet  

**Exit:** Players see Scaling Frontier names; existing progress still valid.

### P1 — Multi-system schema

**Goal:** Compound stops work end-to-end for 1–2 flagships.

- Introduce `CampaignStop` / `CampaignSystem` types  
- Migrate progress storage v2  
- Update `campaignHref`, unlock, stars, CampaignMap panel  
- Wire design route to `system` query param  
- Ship **Media Forge** + **Scaling Madness** as first compounds (may need new problems or temporary reuse)  
- Wrench prompt accepts `wrenchTheme`  

**Exit:** Clearing a 2-system stop unlocks the next path node.

### P2 — New content pack

**Goal:** Catalog density.

- Author remaining stops from section D (target **20+** live stops)  
- New problems in `problems.ts` for gaps (image pipeline, queue system, consistency, tool gateway)  
- Side paths: Cache Canyon, Queue Quake, Tool Tempest  
- World visual motifs (gradients already world-colored — extend)  
- Lore/tagline fields fully populated  

**Exit:** Map feels full; main path ~18 stops; optional ~4–6.

### P3 — Branching paths & bosses

**Goal:** Replay & mastery.

- Optional bosses (`boss: true`) with harder passScore / more wrenches  
- Branch unlocks (OR-gates: clear A *or* B)  
- True ending: **The Convergence**  
- Cosmetics / titles from side stars  
- Authoring tools or structured markdown for content ops  

**Exit:** Second playthrough meaningfully different; “map feels like a world.”

### Dependency sketch

```
P0 copy ──► P1 schema ──► P2 content pack ──► P3 branching
                │
                └── wrenchTheme in generator
```

**Note:** Map P0 can ship **in parallel** with Auth/Progress. Map P1+ is independent of cloud progress (localStorage progress still works). If multi-system progress must sync to cloud, align progress schema v2 with [save-game-progress.md](./save-game-progress.md) before Progress P2.

### Implementation checklist

#### P0 — Rename / flavor only (no schema break)

**Copy in `src/lib/campaign.ts`**

- [ ] Update `worldName` strings to redesigned world names (or interim names from §F)
- [ ] Apply P0 label map from §D / Appendix 3 (e.g. Live Chat → Live Wire, The Feed → Feed Frenzy)
- [ ] Expand `flavor` (or add `tagline` if type change is trivial) for every existing level
- [ ] Keep all `id` and `problemId` values unchanged so localStorage progress still unlocks
- [ ] Keep `x`/`y`/`unlocksAfter`/`wrenchCount`/`passScore` unless intentionally retuning

**UI**

- [ ] Campaign detail panel shows mapLabel + lore/flavor (not only problem title)
- [ ] World header uses `worldName`
- [ ] Optional: short tagline under stop name

**QA**

- [ ] Load `/campaign` with existing `sdl-campaign-progress-v1` — completed nodes still completed
- [ ] Enter a level → still opens correct `problemId`
- [ ] No multi-system UI yet

**P0 exit:** Map reads like places; progress unbroken.

#### P1 — Multi-system schema + 2 flagships

**Types + data**

- [ ] Add `CampaignSystem` + `CampaignStop` (or extend `CampaignLevelNode`) in `src/lib/types.ts`
- [ ] Migration helper: legacy single-`problemId` level → one primary system
- [ ] Convert `CAMPAIGN_LEVELS` to multi-system shape (backward-compatible readers OK)
- [ ] Bump campaign progress storage key or schema version if needed (`v1` → `v2`)
- [ ] Migration: old completed level ids map 1:1 to stop complete; primary system auto-complete

**Routing + workspace**

- [ ] `campaignHref(stopId, systemId?)` → `/design/{problemId}?campaign={stopId}&system={systemId}`
- [ ] Design page reads `system` query; loads correct problem for that system
- [ ] Unlock: stop complete only when all **primary + escalation** systems cleared
- [ ] Stars: implement chosen rule (proposal: max of primary systems)

**UI**

- [ ] Stop detail panel lists systems with CLEARED / NEXT / optional
- [ ] Continue enters current incomplete system
- [ ] Map node still one chip per stop (not sub-nodes yet)

**Flagship content**

- [ ] Author or stub problems for **Scaling Madness** (API spike + queue/workers)
- [ ] Author or stub problems for **Media Forge** (image pipeline + video/transcode)
- [ ] Insert/replace stops on path; wire unlocks
- [ ] Pass `wrenchTheme` into wrench API prompt for these stops

**QA**

- [ ] Clear system 1 only → next stop still locked; system 2 available
- [ ] Clear both systems → next stop unlocks
- [ ] Legacy progress users not soft-locked

**P1 exit:** Two compound stops playable end-to-end.

#### P2 — Content pack (density)

**Catalog**

- [ ] Pick main-path set from §D + §J (target ~16–20 main stops)
- [ ] Assign coordinates + unlock graph; avoid overcrowding
- [ ] Fill lore/tagline for every live stop
- [ ] Mark optional sides: e.g. Cache Canyon, Queue Quake, Tool Tempest

**Problems**

- [ ] Add missing `DesignProblem` entries in `problems.ts` (image, queue, consistency, tool gateway, etc.)
- [ ] evaluationFocus + constraints for each new problem
- [ ] Prefer unique `problemId`s per system

**Map polish**

- [ ] World color/motif pass on `CampaignMap.tsx`
- [ ] Optional nodes visually distinct (dashed path / secondary color)
- [ ] Skill notes internal matrix updated (Appendix 1)

**QA**

- [ ] Full main path completable from empty progress
- [ ] Optional sides do not block main unlocks
- [ ] Acceptance criteria §I naming/structure items checked

**P2 exit:** Map feels full; ≥20 catalog stops or agreed main-path length.

#### P3 — Branching, bosses, true ending

- [ ] Support OR unlocks (`unlocksAfterAny` or equivalent) if branching
- [ ] `boss: true` stops with higher `passScore` / more wrenches
- [ ] Add **The Convergence** (or final optional boss)
- [ ] Side-star rewards (titles/cosmetics) if product wants them
- [ ] Content authoring format (TS catalog vs seed table from §J)
- [ ] If DB seed: migrate §J 50 names into `campaign_stop_catalog` (`is_active` flags)

**QA**

- [ ] Second playthrough path can differ (if branches ship)
- [ ] Boss clear conditions documented
- [ ] No dead ends in unlock graph

**P3 exit:** Replay value + “world” feel.

#### Cross-cutting (any phase)

- [ ] Do not force auth for map play (guest localStorage OK)
- [ ] If cloud progress exists, multi-system progress fields sync per save-progress schema version
- [ ] Wrench themes stay place-appropriate (scale places ≠ random XSS)
- [ ] Keep §J slug list as source for future DB seed; mark which slugs are `is_active`

---

## H. Open questions

| # | Question | Options / notes | Lean |
|---|----------|-----------------|------|
| 1 | **Branching vs linear spine?** | Linear for onboarding clarity; branches for mastery | Linear spine + optional sides first |
| 2 | **Content authoring cost** | Hand-authored problems are gold; volume is slow | Hand-author flagships; template the rest |
| 3 | **AI-generated problems vs hand-authored** | AI good for variants/wrenches; risky for core curriculum | AI for wrenches + side variants; human for primary systems |
| 4 | **Stars: per system or per stop?** | Per system is fairer; per stop is simpler UI | Per system under the hood; show stop aggregate |
| 5 | **Session length for compounds** | 2 systems can be 45–90 min | Soft save between systems; show time estimate on panel |
| 6 | **Can player skip escalation?** | Skip = incomplete stop vs “easy mode” | No skip on main path; sides optional |
| 7 | **Reuse one problem in two stops?** | Confusing for progress | Prefer unique problemIds; allow remix with new ids |
| 8 | **How hard to theme wrenches?** | Prompt-only vs tagged incident library | Start prompt theme string; later curated bank |
| 9 | **Map density** | 25 nodes vs readable path | Cap main path ~16–20; rest optional |
| 10 | **Naming tone** | Pure fantasy vs tech-pun | Tech-pun with place energy (Scaling Madness, Cache Canyon) |
| 11 | **Progress migration** | Force reset vs map old completions | Map 1:1 stop ids; systems auto-complete if legacy done |
| 12 | **Interview mode link** | Freeplay problems vs campaign-only compounds | Freeplay keeps problem catalog; campaign is narrative layer |

---

## I. Acceptance criteria — “map feels contentful”

Ship bar for calling the map **contentful** (post P0–P2):

### Naming & identity

- [ ] ≥ **20** named stops on the published catalog (main + optional)  
- [ ] Every stop has **mapLabel** that is not a raw problem title clone (or is intentionally iconic, e.g. Hash Ring)  
- [ ] Every stop has **tagline or lore** (≥1 sentence) visible in the detail panel  
- [ ] Worlds have **distinct names + color identity** (not only “World 2”)  

### Structure

- [ ] ≥ **3** multi-system (compound) stops live (e.g. Scaling Madness, Media Forge, Eval Peak or Ledger Labyrinth)  
- [ ] Progress clearly shows **per-system** completion inside a stop  
- [ ] Unlock rules documented and match UX (no soft-lock)  

### Wrenches & curriculum

- [ ] Compound stops pass a **wrenchTheme** into generation (scale places get scale incidents)  
- [ ] Curriculum notes (internal) map each stop → **skills practiced**  
- [ ] Mix of **classic distributed systems** and **agentic** stops on the main path  

### Feel tests (playtest)

- [ ] New player can **recall 5 stop names** after one session without looking  
- [ ] Player describes at least one stop as a **place/story**, not “the chat problem”  
- [ ] No “checklist fatigue” report on main path ≤ 12 stops in first sitting (pacing OK)  
- [ ] Optional content is **visibly optional** (not confused with main path)  

### Engineering hygiene

- [ ] Legacy progress migrates without silent wipe  
- [ ] Freeplay `/design/[problem]` still works without campaign params  
- [ ] Spec stays source of truth until types land in `src/lib/types.ts`  

---

## Appendix 1 — Skills ↔ stops matrix (draft)

| Skill family | Stops that teach it |
|--------------|---------------------|
| Caching | Tiny Links, Cache Canyon, Feed Frenzy, Global Stream |
| Rate limiting / abuse | Gatekeeper, Tool Tempest, Scaling Madness |
| Sharding / hashing | Hash Ring, Snowflake Falls, Tenant Tangle |
| Realtime / presence | Live Wire, Geo Match |
| Queues / async | Scaling Madness, Queue Quake, Media Forge |
| Consistency / multi-region | Consistency Crisis, Ledger Labyrinth |
| Money / idempotency | Ledger Labyrinth |
| Media pipelines | Media Forge, Global Stream, Thumbstack |
| RAG / retrieval | RAG Ruins |
| Multi-agent | Agent Swarm, Agent OS |
| Evals / quality loops | Eval Peak |
| Platforms / tenancy | Tenant Tangle, Agent OS, The Convergence |

---

## Appendix 2 — Wrench theme vocabulary (for generators)

Suggested closed set for prompts / filters:

`scale` · `latency` · `availability` · `consistency` · `security` · `cost` · `data-loss` · `backpressure` · `geo` · `agent-hallucination` · `agent-cost` · `tool-abuse` · `eval-drift` · `multi-tenant` · `media-pipeline`

Stops declare 1 primary + 0–2 secondary themes.

---

## Appendix 3 — P0 copy pack (ready to paste)

Short lore lines for existing nodes after rename:

| mapLabel | tagline / flavor |
|----------|------------------|
| Tiny Links | Your first production deploy. Keep it short. Keep it up. |
| Gatekeeper | Bots at the gate. You hold the keys. |
| Hash Ring | Find the data. Survive the rebalance. |
| Live Wire | Messages don’t wait. Neither do users. |
| Snowflake Falls | Billions of IDs. Zero collisions. No excuses. |
| Feed Frenzy | One post. A million timelines. Don’t melt. |
| Geo Match | Riders, drivers, maps, mayhem. |
| RAG Ruins | Answers are buried. Dig carefully. |
| Web Scout | The open web is a tool and a trap. |
| Agent Swarm | Parallel minds. One deadline. |
| Code Crucible | Agents that write code must survive review. |
| Ledger Labyrinth | Money moves once — or not at all. |
| Global Stream | The world hits play at once. |
| Agent OS | Every agent’s runtime. Every tenant’s rules. |
| Eval Peak | The final boss: measure everything. |

---

## Appendix 4 — File touch list (when implementing)

| Phase | Files (expected) |
|-------|------------------|
| P0 | `src/lib/campaign.ts`, maybe panel copy in `CampaignMap.tsx` |
| P1 | `src/lib/types.ts`, `src/lib/campaign.ts`, design route campaign params, wrench prompt plumbing |
| P2 | `src/lib/problems.ts` (+ new problems), campaign catalog expansion |
| P3 | unlock graph, optional path rendering, progress OR-gates |

---

## J. Database-ready level name catalog (50)

**Status:** Locked brainstorm for future `campaign_stops` (or seed JSON) table  
**Rule:** Names are **places**, not textbooks. Each is *tangentially* tied to a real system-design component, interview problem, or famous engineering failure/solution.  
**Intended storage (later):** seed rows — `slug`, `map_label`, `tagline`, `theme_tags[]`, `real_world_hook`.

### Naming craft notes

- Prefer 2 words, stress on stakes (*Madness*, *Stampede*, *Quake*, *Peak*).
- Encode failure mode or landmark paper, not algorithm jargon alone.
- Safe to retheme existing campaign nodes (Tiny Links stays; Gatekeeper stays; Hash Ring stays).

### Famous engineering hooks (research notes)

| Real-world problem / solution | How we game it |
|-------------------------------|----------------|
| **Thundering herd / cache stampede** — many clients refresh one expired key at once; Meta’s memcache “leases” and request coalescing tame it | **Stampede Pass**, **Herd Hollow** |
| **Consistent hashing** — Dynamo / Cassandra / CDN rebalance without reshuffling everything | **Hash Ring**, **Shard Spire** |
| **Amazon Dynamo (2007)** — AP shopping-cart availability under partitions | **Dynamo Drift** |
| **Google Chubby / Paxos** — lock + coordination service for Bigtable et al. | **Chubby Gate**, **Paxos Parliament** |
| **Raft** — understandable consensus vs classic Paxos | **Raft Rapids** |
| **Byzantine Generals** — consensus with liars; BFT | **Byzantine Bazaar** |
| **Two Generals** — unreliable networks make perfect agreement impossible | **Two Generals’ Ridge** |
| **Google Spanner / TrueTime** — global consistency with bounded clock uncertainty | **TrueTime Tundra** |
| **MapReduce** — batch at planet scale | **MapReduce Mesa** |
| **Kafka @ LinkedIn** — log as system of record; later KIP-500 removes ZooKeeper | **Kafka Canyon**, **Quorum Quay** |
| **Hot key / celebrity problem** — one key so hot it melts a partition (feeds, caches) | **Celebrity Crater** |
| **Cascading failure** — e.g. DynamoDB 2015 us-east cascade patterns | **Cascade Crags** |
| **Write fan-out** (FB-style feeds) vs read fan-out | **Feed Frenzy** |
| **Idempotent payments / dual-write drift** | **Ledger Labyrinth**, **Dual-Write Dunes** |
| **Exponential backoff + full jitter (AWS)** | **Backoff Badlands** |
| **Circuit breakers (Netflix Hystrix lineage)** | **Breaker Bay** |
| **Head-of-line blocking / HOL** | **Head-of-Line Harbor** |
| **Exactly-once delivery** (usually “effectively once” + idempotency) | **Exactly-Once Oasis** (ironic boss) |

### The 50 names (seed list)

| # | `map_label` | Suggested `slug` | Tangential system-design hook | Real-world / classic problem |
|---|-------------|------------------|-------------------------------|------------------------------|
| 1 | **Tiny Links** | `tiny-links` | URL shortener, base62 IDs, redirect cache | bit.ly-class design; read-heavy redirects |
| 2 | **Gatekeeper** | `gatekeeper` | API gateway + rate limits | Token bucket / sliding window multi-instance limits |
| 3 | **Hash Ring** | `hash-ring` | Consistent hashing, vnodes | Dynamo-style partition ring |
| 4 | **Stampede Pass** | `stampede-pass` | Cache stampede, single-flight | Thundering herd; Meta memcache leases |
| 5 | **Herd Hollow** | `herd-hollow` | Thundering herd on wake/expire | Same family as stampede; process wake storms |
| 6 | **Cache Canyon** | `cache-canyon` | Multi-layer cache, invalidation | Cache invalidation (hard problem) |
| 7 | **Hot Key Hollow** | `hot-key-hollow` | Hot partitions, key skew | Celebrity keys in Redis/KV |
| 8 | **Shard Spire** | `shard-spire` | Resharding, rebalance | Consistent hashing rebalance storms |
| 9 | **Dynamo Drift** | `dynamo-drift` | AP KV, hinted handoff | Amazon Dynamo paper (shopping cart) |
| 10 | **Quorum Quicksand** | `quorum-quicksand` | R + W > N tradeoffs | Dynamo quorum math under failure |
| 11 | **Live Wire** | `live-wire` | WebSockets, presence | Real-time chat fan-out |
| 12 | **Snowflake Falls** | `snowflake-falls` | Distributed unique IDs | Twitter Snowflake; clock skew |
| 13 | **Feed Frenzy** | `feed-frenzy` | News feed, fan-out write/read | Social feed at scale |
| 14 | **Celebrity Crater** | `celebrity-crater` | Hot user / viral post | Celebrity problem on timelines |
| 15 | **Geo Match** | `geo-match` | Geo index, matching | Ride-sharing matching |
| 16 | **Scaling Madness** | `scaling-madness` | Horizontal scale, backpressure | Traffic spike / launch storms |
| 17 | **Queue Quake** | `queue-quake` | Queues, workers, DLQ | Async offload; poison messages |
| 18 | **Backpressure Bluffs** | `backpressure-bluffs` | Load shedding, queues full | Slow consumer / unbounded queues |
| 19 | **Breaker Bay** | `breaker-bay` | Circuit breakers | Netflix resilience patterns |
| 20 | **Backoff Badlands** | `backoff-badlands` | Retry storms | AWS exponential backoff + jitter |
| 21 | **Cascade Crags** | `cascade-crags` | Cascading failure | Multi-service outage amplification (e.g. 2015-class incidents) |
| 22 | **Consistency Crisis** | `consistency-crisis` | Multi-region consistency | CAP tradeoffs under partition |
| 23 | **Split-Brain Bog** | `split-brain-bog` | Network partition leadership | Split brain dual primaries |
| 24 | **Dual-Write Dunes** | `dual-write-dunes` | Dual writes, outbox | Dual-write drift / change data capture |
| 25 | **TrueTime Tundra** | `truetime-tundra` | Global clocks, Spanner-like | Google Spanner / TrueTime |
| 26 | **Paxos Parliament** | `paxos-parliament` | Consensus | Lamport Paxos |
| 27 | **Raft Rapids** | `raft-rapids` | Leader election, logs | Raft consensus |
| 28 | **Chubby Gate** | `chubby-gate` | Distributed locks | Google Chubby lock service |
| 29 | **Byzantine Bazaar** | `byzantine-bazaar` | BFT / untrusted peers | Byzantine Generals Problem |
| 30 | **Two Generals’ Ridge** | `two-generals-ridge` | Unreliable messaging | Two Generals Problem (impossibility intuition) |
| 31 | **Kafka Canyon** | `kafka-canyon` | Log, partitions, consumer groups | LinkedIn Kafka scale; event backbone |
| 32 | **Quorum Quay** | `quorum-quay` | Metadata quorum | ZooKeeper → KRaft (KIP-500) era |
| 33 | **MapReduce Mesa** | `mapreduce-mesa` | Batch pipelines | Google MapReduce |
| 34 | **Pipeline Peak** | `pipeline-peak` | Stream + batch analytics | Late data, watermarks |
| 35 | **Exactly-Once Oasis** | `exactly-once-oasis` | Idempotency, EOS myths | “Exactly once” vs effectively once |
| 36 | **Head-of-Line Harbor** | `hol-harbor` | HOL blocking | HTTP/1.1 / queue HOL |
| 37 | **Tenant Tangle** | `tenant-tangle` | Multi-tenant isolation | Noisy neighbor |
| 38 | **Ledger Labyrinth** | `ledger-labyrinth` | Payments, double-entry | Idempotent charges, reconciliation |
| 39 | **Idempotency Isle** | `idempotency-isle` | Idempotency keys | Safe retries for money / writes |
| 40 | **Media Forge** | `media-forge` | Image + video pipelines | Transcoding, CDN origin |
| 41 | **Global Stream** | `global-stream` | Live/VOD streaming | World-event traffic, CDN miss storms |
| 42 | **Thumbstack** | `thumbstack` | Thumbnail / preview gen | Upload burst + format zoo |
| 43 | **Origin Shield** | `origin-shield` | CDN origin protection | Origin overload under miss storms |
| 44 | **RAG Ruins** | `rag-ruins` | RAG retrieval + tools | Stale docs, retrieval poison |
| 45 | **Web Scout** | `web-scout` | Web-research agent | Tool timeouts, prompt injection |
| 46 | **Agent Swarm** | `agent-swarm` | Multi-agent parallelization | Coordination, duplicated work |
| 47 | **Tool Tempest** | `tool-tempest` | Tool gateway, budgets | Tool amplification / cost runaway |
| 48 | **Code Crucible** | `code-crucible` | Coding agent + PR safety | Malicious tool use, secret exfil |
| 49 | **Agent OS** | `agent-os` | Multi-tenant agent platform | Policy, audit, runtime |
| 50 | **Eval Peak** | `eval-peak` | Evals, continuous improvement | Silent regressions, metric gaming |

### Suggested DB seed shape (future)

```sql
-- illustrative only — implement with content pipeline later
create table public.campaign_stop_catalog (
  slug text primary key,
  map_label text not null,
  tagline text,
  theme_tags text[] not null default '{}',
  real_world_hook text,
  world int,
  sort_order int not null default 0,
  is_active boolean not null default false  -- true when wired into campaign graph
);

-- seed all 50 with is_active=false except those already on the map
```

### Priority for first DB seed + map wiring

1. **Scaling Madness** — compound scale story  
2. **Media Forge** — image → video compound  
3. **Stampede Pass** / **Cache Canyon** — classic cache failure mode  
4. **Consistency Crisis** — multi-region  
5. **Eval Peak** — endgame boss (already on map)

---

## Decision log (fill as we decide)

| Date | Decision | Choice |
|------|----------|--------|
| — | Default compound UX | Sequential phases on one node |
| — | World count v1 | TBD: 4 lean vs 6 full |
| — | First compounds | Scaling Madness + Media Forge |
| 2026-08-06 | Level name inventory | **50 names** cataloged in §J for future DB seed |

---

*End of draft. This document is a product/content brainstorm, not implementation. Next concrete step: approve P0 rename table + world names, then lock 2 flagship compounds for P1 schema work.*
