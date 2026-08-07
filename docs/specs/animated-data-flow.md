# Spec: Animated Data-Flow Playback

**Status:** Draft  
**Owner:** Product / Frontend  
**Depends on:** Canvas graph (`nodes` + `edges`), guided builds, free practice / campaign submit  
**Related:** Training “Show me how”, campaign complete, free-design evaluation  

---

## 1. Problem

After a user finishes a design (or completes a guided build), a **static** graph is hard to internalize. Interviewers care about **request/data paths**: where a write goes, how a read hits cache then DB, how a job hops API → queue → worker → DLQ.

Users need a **playable completed system** where tokens (packets) animate along edges so the flow is obvious.

---

## 2. Goals

| Goal | Success signal |
|------|----------------|
| Visualize happy-path and key alternate paths | User can name the path after one playback |
| Work on **any** completed canvas graph | Not only hand-authored demos |
| Teach, not just decorate | Each hop can show a short caption |
| Non-blocking UX | Can minimize coach / skip animation |
| Reuse existing React Flow canvas | No separate diagram engine v1 |

### Non-goals (v1)

- Full discrete-event simulation (queueing theory, backpressure numbers)
- Pixel-perfect sequence diagrams
- Multiplayer synchronized playback
- Auto-inferred paths with 100% correctness for arbitrary graphs (best-effort + overrides)

---

## 3. User stories

1. **As a learner finishing “Show me how”**, I want **Play data flow** so I see the completed architecture *in motion*.
2. **As a campaign player who passed a level**, I want to **replay the request path** the AI just accepted.
3. **As a free-practice user**, I want to pick **Read path / Write path / Async path** and watch tokens move.
4. **As a learner**, I want **step labels** (“cache hit”, “enqueue job”) timed with each hop.

---

## 4. Entry points

| Surface | When enabled | Default scenario |
|---------|--------------|------------------|
| Guided build | Last step complete | Primary scenario for that build |
| Training lesson | Lesson complete | Path including the piece just added |
| Campaign | Level passed | Scenario derived from problem + graph |
| Free design | ≥2 nodes + ≥1 edge | User picks scenario, or “auto-detect” |

UI control (header or bottom bar):

```
[ ▶ Play flow ]  [ Scenario ▾ ]  [ 1x ▾ ]  [ Loop ]
```

---

## 5. Concepts

### 5.1 Packet (token)

Visual unit that travels along edges.

```ts
type FlowPacket = {
  id: string;
  label: string;           // e.g. "GET /r/:code"
  kind: "request" | "response" | "event" | "error";
  color: string;
  /** edge id currently traversing */
  edgeId: string;
  /** 0–1 progress along current edge */
  t: number;
};
```

### 5.2 Hop

One edge traversal + optional dwell on a node.

```ts
type FlowHop = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  durationMs: number;
  caption: string;         // "Lookup short code in cache"
  nodeDwellMs?: number;    // pause on target node
  highlightNodeIds?: string[];
};
```

### 5.3 Scenario (trace)

Named path through the graph.

```ts
type FlowScenario = {
  id: string;
  name: string;            // "Redirect (cache hit)"
  description: string;
  hops: FlowHop[];
  /** Optional second concurrent packet (e.g. async fan-out) */
  parallel?: FlowScenario[];
};
```

### 5.4 Playback state

```ts
type PlaybackState =
  | { status: "idle" }
  | { status: "playing"; scenarioId: string; hopIndex: number; startedAt: number }
  | { status: "paused"; scenarioId: string; hopIndex: number; t: number }
  | { status: "done"; scenarioId: string };
```

---

## 6. Scenario generation

### 6.1 Hand-authored (priority for guided builds)

Each `GuidedBuild` may declare:

```ts
flowScenarios?: FlowScenarioDefinition[];
```

Where hops reference **node ids** from the build (not ephemeral UI ids). Stable ids already exist in `guided-builds.ts`.

### 6.2 Heuristic auto-trace (free design / campaign)

**v1 algorithm (deterministic):**

1. Classify nodes by `componentType` / category (`client`, `edge`, `compute`, `data`, `messaging`, `agent`, …).
2. Pick **entry**: first `client` (or leftmost node).
3. Build adjacency from edges.
4. Generate up to 3 scenarios:
   - **Write / primary path:** BFS from client preferring `edge` → `compute` → `data`.
   - **Read / cache path:** if `cache` exists, path client → … → cache → (optional) db.
   - **Async path:** if `message_queue` exists, path … → queue → worker → (optional) dlq-shaped second queue.
5. Caption templates by edge endpoints:

| From → To | Caption template |
|-----------|------------------|
| client → lb/gateway | Client sends request |
| * → cache | Check cache |
| cache → db | Cache miss → load from DB |
| * → queue | Enqueue async work |
| queue → worker | Worker consumes message |
| agent → tool_* | Agent invokes tool |
| tool → llm/agent | Tool result returns to model |

6. If no path found: disable Play + tooltip “Connect at least one path from a client.”

### 6.3 LLM-assisted scenarios (v1.5, optional)

`POST /api/flow-scenario` with serialized graph + problem → Zod-validated list of scenarios. Use only when heuristic confidence is low. Cost: one SpaceXAI call; cache by graph hash.

---

## 7. Animation UX

### 7.1 Visual design

- Packet: small rounded pill or circle with label, glow matching `kind`.
- Active edge: brighter stroke + optional dash offset animation.
- Active node: pulse ring (reuse design-node selected style).
- Caption toast: bottom-center or coach strip (“Cache hit — return 302”).
- Dim non-active graph to ~40% opacity during playback.

### 7.2 Implementation approach (recommended)

**React Flow + SVG overlay**

1. Keep graph in React Flow (read-only during play).
2. Overlay absolutely positioned packets using edge path geometry:
   - Use `@xyflow/react` `getBezierPath` / edge internals or store path refs.
3. Drive `t` with `requestAnimationFrame` or Framer Motion `animate`.
4. On hop end: pause `nodeDwellMs`, advance hop index.

**Alternative:** CSS `offset-path` on edge SVG path — good for simple curves.

### 7.3 Timing defaults

| Setting | Default |
|---------|---------|
| Hop duration | 700–1100 ms by edge length |
| Node dwell | 400 ms |
| Playback speeds | 0.5x, 1x, 1.5x, 2x |
| Loop | off |

### 7.4 Controls

- Play / Pause / Restart  
- Next hop / Previous hop (scrub)  
- Scenario dropdown  
- Speed  
- “Exit playback” restores edit mode (if editable surface)

---

## 8. UI surfaces

### 8.1 `DataFlowPlayer` component

Props:

```ts
type DataFlowPlayerProps = {
  nodes: Node[];
  edges: Edge[];
  scenarios: FlowScenario[];
  defaultScenarioId?: string;
  autoplay?: boolean;
  readOnlyGraph?: boolean;
  onComplete?: () => void;
};
```

### 8.2 Integration points

| File / area | Change |
|-------------|--------|
| `GuidedBuildWorkspace` | On last step: **Play data flow** CTA |
| `TrainingWorkspace` | On lesson complete: optional play |
| `DesignWorkspace` | Button when graph connected |
| Campaign pass panel | “Watch how traffic would flow” |

### 8.3 Completed “showcase” mode

When entering playback from guided build complete:

- Hide palette / attributes (or collapse).
- Show **Completed system** badge.
- Autoplay primary scenario once; then idle with Replay.

---

## 9. Data model additions

```ts
// lib/types.ts (or flow-types.ts)
export type FlowPacketKind = "request" | "response" | "event" | "error";

export interface FlowHopSpec {
  from: string; // node id
  to: string;
  caption: string;
  durationMs?: number;
  dwellMs?: number;
}

export interface FlowScenarioSpec {
  id: string;
  name: string;
  description?: string;
  hops: FlowHopSpec[];
}
```

Guided builds:

```ts
// on GuidedBuild
flowScenarios?: FlowScenarioSpec[];
```

---

## 10. Accessibility & performance

- `prefers-reduced-motion`: skip motion; show step list captions only.
- Don’t run rAF when tab hidden (`document.visibilityState`).
- Cap concurrent packets to 3.
- Aria-live region announces hop captions for screen readers.

---

## 11. Telemetry (optional)

- `flow_play_start` / `flow_play_complete` (scenario id, surface)
- Drop-off hop index

---

## 12. Rollout plan

| Phase | Scope | Est. |
|-------|--------|------|
| **P0** | Player + hand-authored scenarios for all guided builds | 2–3 d |
| **P1** | Heuristic scenarios for free design | 2 d |
| **P2** | Campaign / training hooks + speed/loop | 1 d |
| **P3** | LLM scenario assist + parallel packets | 2 d |

---

## 13. Acceptance criteria

1. Completing **URL shortener** guided build offers **Play data flow**.
2. At least one scenario animates client → … → cache/db with captions.
3. User can pause, restart, and change speed.
4. Reduced-motion users get non-animated step captions.
5. Free design with a linear client→app→db path auto-generates a playable scenario.
6. Playback does not corrupt graph state when returning to edit.

---

## 14. Open questions

- Should packets reverse for **response** path (db → cache → client)?  
- Multi-packet fan-out for pub/sub (one-to-many)?  
- Export playback as GIF/WebM (nice-to-have, out of v1)?

---

## 15. References (internal)

- Canvas: `src/components/canvas/DesignWorkspace.tsx`
- Guided builds: `src/lib/guided-builds.ts`
- Training complete UX: `src/components/training/GuidedBuildWorkspace.tsx`
