# Spec: Save Game Progress (Cloud Sync)

**Status:** Draft (reviewed after auth spec revision)  
**Owner:** Full-stack / Product  
**App:** System Design Lab (Next.js App Router + TypeScript)  
**Depends on:** [Supabase Auth](./supabase-auth.md)  
**Enables:** cross-device resume, portfolio designs, future billing quotas  

### Review note (post auth-spec)

| Auth decision | Impact on this spec |
|---------------|---------------------|
| App identity table is **`public.user`** (auto-created on Google signup via trigger) | Progress rows key off `auth.uid()` = `public.user.id`. Do **not** invent a separate `profiles` table. |
| Session via **Next.js 16 Proxy** + `@supabase/ssr` cookies | Client progress sync uses browser Supabase client; Server Actions/RSC use server client. No custom session store. |
| Anonymous still allowed | localStorage remains guest path; merge on first login unchanged. |
| No auth force on free play | Autosave to cloud only when signed in; guests keep local draft only. |

**No blocking redesign** of merge rules, tables, or UX from auth review — only FK/identity wording alignment.

---

## 1. Problem

All meaningful progress is **localStorage-only** today:

| Domain | Key | Shape (summary) |
|--------|-----|-----------------|
| Campaign | `sdl-campaign-progress-v1` | `CampaignProgress`: completed levels, stars, wrenches survived, last level |
| Training | `sdl-training-progress-v1` | `TrainingProgress`: completed lesson ids, last lesson |

Implementation today:

- `src/lib/campaign.ts` — `loadProgress` / `saveProgress` / `markLevelComplete`
- `src/lib/training-lessons.ts` — `loadTrainingProgress` / `saveTrainingProgress` / `markLessonComplete`
- Types: `CampaignProgress` in `src/lib/types.ts`; `TrainingProgress` in `src/lib/training-lessons.ts`

Consequences:

1. **No cross-device continuity** — laptop vs phone progress diverge.
2. **No mid-level resume** — React Flow graphs (`DesignGraph`) are ephemeral; refresh or leave a campaign design and work is gone.
3. **Weak retention loop** — players cannot treat the campaign as a long-running save file.
4. **No foundation for product** — billing quotas, anti-abuse on AI routes, and portfolio features all need a durable per-user store.

Auth (Supabase) is specified separately. This document owns **what we store, how we sync, and how we never lose stars on first login.**

---

## 2. Goals / Non-goals

### Goals

| Goal | Notes |
|------|--------|
| Cloud source of truth when signed in | Supabase Postgres, RLS by `auth.uid()` |
| Offline / guest still works | localStorage remains cache + anonymous mode |
| Never lose progress on merge | Union completed ids; max stars; monotonic wrenches |
| Mid-level design resume | Autosave in-progress `DesignGraph` for campaign (and free practice) |
| Soft UX, not hard gates | Guest can play; signed-in gets save indicators + resume |
| Schema versioning | Progress payloads can evolve without bricking clients |

### Non-goals (v1)

- Full design portfolio UI / sharing / public galleries  
- Global leaderboards or competitive rankings  
- Real-time multiplayer or collaborative editing  
- Full CRDT / OT conflict resolution for concurrent graph edits  
- Server-side validation of “did they really beat this level” (trust client scores for v1)  
- Account deletion UI (support path OK; cascade delete when auth deletion exists)  
- Mobile-native offline queue beyond browser localStorage  

---

## 3. What to persist

### 3.1 Must (v1)

| Data | Why |
|------|-----|
| Campaign progress | Map unlocks, stars, wrenches survived, last played level |
| Training progress | Completed lessons + last lesson |
| Merge from localStorage on first login (and subsequent logins with local ahead) | Migration path; never strand guest work |

### 3.2 Should (v1 or v1.1)

| Data | Why |
|------|-----|
| In-progress level design graph (autosave) | Resume mid-level / free practice |
| Attempt context | Phase (`design` / `wrench` / `fixing`), current wrench index, last score snapshot if cheap |
| Last wrench survival counter consistency | Already in campaign progress; keep authoritative after merge |

### 3.3 Later

| Data | Why |
|------|-----|
| Design library (named saves, folders) | Portfolio, interview prep |
| Attempt history (pass/fail, scores, timestamps) | Learning analytics, retention |
| Stars leaderboards / friends | Social loop |
| Cloud sync conflict UI polish | Multi-device simultaneous play |
| Guided-build progress separate table | If guided builds need more than lesson-style completion |

---

## 4. Data model (Supabase Postgres + RLS)

Assume Supabase Auth: `auth.users.id` is UUID and equals **`public.user.id`** (created on signup — see auth spec).  
All progress tables key ownership by `user_id uuid` with RLS `auth.uid() = user_id`.

**FK recommendation:** `REFERENCES auth.users(id) ON DELETE CASCADE` (auth is source of truth; `public.user` cascades from the same id via its own FK). Optionally add a second FK to `public."user"(id)` if you want DB-enforced “app user must exist before progress” — only after the signup trigger is proven in prod.

### 4.1 SQL

```sql
-- =============================================================================
-- System Design Lab — progress schema (v1)
-- Requires: auth.users + public."user" (auth spec)
-- Run in Supabase SQL editor or migrations.
-- =============================================================================

-- Schema version for client migrations / feature flags
CREATE TABLE IF NOT EXISTS progress_meta (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schema_version INT NOT NULL DEFAULT 1,
  last_merged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign progress (replaces sdl-campaign-progress-v1 as cloud SoT)
CREATE TABLE IF NOT EXISTS campaign_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_level_ids TEXT[] NOT NULL DEFAULT '{}',
  -- stars: { "level-id": 0|1|2|3 }
  stars JSONB NOT NULL DEFAULT '{}'::jsonb,
  wrenches_survived INT NOT NULL DEFAULT 0 CHECK (wrenches_survived >= 0),
  last_played_level_id TEXT,
  -- Optional attempt context for resume (v1.1-friendly; nullable in v1)
  attempt_context JSONB,
  schema_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_progress_updated_at_idx
  ON campaign_progress (updated_at DESC);

-- Training progress (replaces sdl-training-progress-v1)
CREATE TABLE IF NOT EXISTS training_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  last_lesson_id TEXT,
  schema_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved / in-progress design graphs
CREATE TABLE IF NOT EXISTS saved_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Optional human title (null for pure autosave drafts)
  title TEXT,
  -- Free practice: DesignProblem.id
  problem_id TEXT,
  -- Campaign: CampaignLevelNode.id (nullable if free practice only)
  campaign_level_id TEXT,
  -- DesignGraph JSON: { nodes: SerializedNode[], edges: SerializedEdge[] }
  graph JSONB NOT NULL,
  -- draft | complete | archived
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'complete', 'archived')),
  -- true = autosave slot for resume; false = explicit user save (library later)
  is_autosave BOOLEAN NOT NULL DEFAULT true,
  -- Campaign phase snapshot when relevant
  campaign_phase TEXT
    CHECK (
      campaign_phase IS NULL
      OR campaign_phase IN ('design', 'wrench', 'fixing', 'passed', 'failed')
    ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active autosave per user + problem + campaign context
CREATE UNIQUE INDEX IF NOT EXISTS saved_designs_autosave_slot_uidx
  ON saved_designs (
    user_id,
    COALESCE(problem_id, ''),
    COALESCE(campaign_level_id, '')
  )
  WHERE is_autosave = true AND status = 'draft';

CREATE INDEX IF NOT EXISTS saved_designs_user_updated_idx
  ON saved_designs (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS saved_designs_user_problem_idx
  ON saved_designs (user_id, problem_id)
  WHERE problem_id IS NOT NULL;

-- Optional v1.1: level attempt / wrench survival log (analytics + resume)
CREATE TABLE IF NOT EXISTS level_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_level_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  -- outcome of this attempt
  outcome TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (outcome IN ('in_progress', 'passed', 'failed', 'abandoned')),
  score INT,
  stars INT CHECK (stars IS NULL OR stars BETWEEN 0 AND 3),
  wrenches_faced INT NOT NULL DEFAULT 0,
  wrenches_survived INT NOT NULL DEFAULT 0,
  -- Optional last wrench payload / ids for resume
  wrench_state JSONB,
  design_snapshot_id UUID REFERENCES saved_designs(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS level_attempts_user_level_idx
  ON level_attempts (user_id, campaign_level_id, started_at DESC);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_progress_updated_at
  BEFORE UPDATE ON campaign_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER training_progress_updated_at
  BEFORE UPDATE ON training_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER saved_designs_updated_at
  BEFORE UPDATE ON saved_designs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER level_attempts_updated_at
  BEFORE UPDATE ON level_attempts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER progress_meta_updated_at
  BEFORE UPDATE ON progress_meta
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 4.2 RLS

```sql
ALTER TABLE progress_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_attempts ENABLE ROW LEVEL SECURITY;

-- progress_meta
CREATE POLICY progress_meta_select_own ON progress_meta
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY progress_meta_insert_own ON progress_meta
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY progress_meta_update_own ON progress_meta
  FOR UPDATE USING (auth.uid() = user_id);

-- campaign_progress
CREATE POLICY campaign_progress_select_own ON campaign_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY campaign_progress_insert_own ON campaign_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY campaign_progress_update_own ON campaign_progress
  FOR UPDATE USING (auth.uid() = user_id);
-- No DELETE policy: soft-reset via UPDATE if product needs reset

-- training_progress
CREATE POLICY training_progress_select_own ON training_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY training_progress_insert_own ON training_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY training_progress_update_own ON training_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- saved_designs
CREATE POLICY saved_designs_select_own ON saved_designs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY saved_designs_insert_own ON saved_designs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY saved_designs_update_own ON saved_designs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY saved_designs_delete_own ON saved_designs
  FOR DELETE USING (auth.uid() = user_id);

-- level_attempts
CREATE POLICY level_attempts_select_own ON level_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY level_attempts_insert_own ON level_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY level_attempts_update_own ON level_attempts
  FOR UPDATE USING (auth.uid() = user_id);
```

**Notes:**

- Use the **anon key + user JWT** on the client; RLS is the security boundary.
- Service role key stays server-only (admin/migrations/billing jobs) — never in browser.
- No public read policies in v1 (no shared designs).

### 4.3 JSON shapes

**`stars` (JSONB)** — mirrors client `Record<string, number>`:

```json
{ "w1-l1": 3, "w1-l2": 1 }
```

**`graph` (JSONB)** — mirrors `DesignGraph`:

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "api-gateway",
      "position": { "x": 120, "y": 80 },
      "data": {
        "componentType": "api-gateway",
        "label": "API Gateway",
        "category": "edge",
        "color": "#…",
        "icon": "…",
        "attributes": {}
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "label": "HTTP" }
  ]
}
```

**`attempt_context` (JSONB, optional on campaign_progress)** example:

```json
{
  "campaignLevelId": "w1-l2",
  "phase": "wrench",
  "wrenchIndex": 0,
  "lastScore": 72,
  "savedDesignId": "uuid-or-null"
}
```

**`metadata` on saved_designs** — freeform for viewport, selected node, UI chrome:

```json
{
  "viewport": { "x": 0, "y": 0, "zoom": 0.85 },
  "selectedNodeId": null
}
```

### 4.4 Size limits (product rules)

| Resource | Soft limit (v1) | Enforcement |
|----------|-----------------|-------------|
| Autosave graph | ~500 KB JSON | Client reject + toast; optional CHECK via trigger later |
| Named saves (later) | 20 drafts free / higher on Pro | App logic after billing |
| Nodes per graph | Soft 150 | Client warning only v1 |

---

## 5. Client architecture

### 5.1 Principles

1. **localStorage is always written** (guest mode + offline cache).
2. **When signed in**, cloud is source of truth after successful hydrate/merge.
3. **Write-through:** mutations update local immediately, then cloud (debounced where heavy).
4. **Read path:** on session available → fetch remote → merge with local → write both.

```
┌─────────────┐     load/save      ┌──────────────────┐
│  UI / hooks │◄──────────────────►│ ProgressService  │
└─────────────┘                    └────────┬─────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
            localStorage              Supabase JS              (optional)
            (always)                  (if session)            API merge RPC
```

### 5.2 Module sketch

```ts
// src/lib/progress/types.ts
import type { CampaignProgress, DesignGraph, CampaignPhase } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";

export const CAMPAIGN_STORAGE_KEY = "sdl-campaign-progress-v1";
export const TRAINING_STORAGE_KEY = "sdl-training-progress-v1";
export const DESIGN_AUTOSAVE_PREFIX = "sdl-design-autosave-v1:"; // + problemId + campaign?

export type SyncStatus = "idle" | "syncing" | "saved" | "offline" | "error";

export interface AttemptContext {
  campaignLevelId: string;
  phase: CampaignPhase;
  wrenchIndex?: number;
  lastScore?: number;
  savedDesignId?: string;
}

export interface CampaignProgressRemote extends CampaignProgress {
  attemptContext?: AttemptContext | null;
  schemaVersion: number;
  updatedAt: string; // ISO
}

export interface TrainingProgressRemote extends TrainingProgress {
  schemaVersion: number;
  updatedAt: string;
}

export interface SavedDesign {
  id: string;
  title: string | null;
  problemId: string | null;
  campaignLevelId: string | null;
  graph: DesignGraph;
  status: "draft" | "complete" | "archived";
  isAutosave: boolean;
  campaignPhase?: CampaignPhase | null;
  metadata: Record<string, unknown>;
  schemaVersion: number;
  updatedAt: string;
  createdAt: string;
}
```

```ts
// src/lib/progress/merge.ts
import type { CampaignProgress } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";

/** Pure merge: never decreases stars or drops completed ids. */
export function mergeCampaignProgress(
  local: CampaignProgress,
  remote: CampaignProgress
): CampaignProgress {
  const completed = new Set([
    ...local.completedLevelIds,
    ...remote.completedLevelIds,
  ]);
  const stars: Record<string, number> = { ...remote.stars };
  for (const [levelId, s] of Object.entries(local.stars ?? {})) {
    stars[levelId] = Math.max(stars[levelId] ?? 0, s ?? 0);
  }
  // Prefer higher total; if equal, max is fine (monotonic counter)
  const wrenchesSurvived = Math.max(
    local.wrenchesSurvived ?? 0,
    remote.wrenchesSurvived ?? 0
  );
  // lastPlayed: prefer more recently played if we have timestamps; else local if set
  const lastPlayedLevelId =
    local.lastPlayedLevelId ?? remote.lastPlayedLevelId;

  return {
    completedLevelIds: [...completed],
    stars,
    wrenchesSurvived,
    lastPlayedLevelId,
  };
}

export function mergeTrainingProgress(
  local: TrainingProgress,
  remote: TrainingProgress
): TrainingProgress {
  const completed = new Set([
    ...local.completedLessonIds,
    ...remote.completedLessonIds,
  ]);
  return {
    completedLessonIds: [...completed],
    lastLessonId: local.lastLessonId ?? remote.lastLessonId,
  };
}
```

```ts
// src/lib/progress/service.ts (conceptual)
export const ProgressService = {
  // Campaign
  async loadCampaign(): Promise<CampaignProgress> { /* local or merge */ },
  async saveCampaign(p: CampaignProgress): Promise<void> { /* local + upsert */ },
  async mergeOnLogin(): Promise<{ campaign: CampaignProgress; training: TrainingProgress }> {},

  // Training
  async loadTraining(): Promise<TrainingProgress> {},
  async saveTraining(p: TrainingProgress): Promise<void> {},

  // Designs
  async loadAutosave(opts: {
    problemId: string;
    campaignLevelId?: string;
  }): Promise<SavedDesign | null> {},
  async saveAutosave(input: {
    problemId: string;
    campaignLevelId?: string;
    graph: DesignGraph;
    campaignPhase?: CampaignPhase;
    metadata?: Record<string, unknown>;
  }): Promise<void> {}, // debounced externally
};
```

### 5.3 Sync strategy

| Event | Behavior |
|-------|----------|
| App boot, signed out | Load localStorage only |
| App boot / session restore, signed in | Fetch remote campaign + training; merge with local; write local + upsert remote if local had new wins |
| Level complete / lesson complete | Update local immediately; upsert remote if signed in (no debounce needed) |
| Canvas graph edit | Debounced autosave (800–1500 ms) to localStorage key **and** Supabase when signed in |
| Sign out | Keep local cache (last known merge); stop remote writes |
| Offline (navigator.onLine false or network error) | Queue optional in-memory; always local; show “offline” indicator; retry on reconnect |

### 5.4 Debounced autosave (canvas)

```ts
// Pseudocode in DesignWorkspace
const debouncedCloudSave = useMemo(
  () =>
    debounce(async (graph: DesignGraph) => {
      // 1) localStorage always
      writeLocalAutosave(problem.id, campaignLevelId, graph);
      // 2) cloud if session
      if (session) {
        setSyncStatus("syncing");
        try {
          await ProgressService.saveAutosave({
            problemId: problem.id,
            campaignLevelId,
            graph,
            campaignPhase,
          });
          setSyncStatus("saved");
        } catch {
          setSyncStatus("error");
        }
      }
    }, 1000),
  [problem.id, campaignLevelId, session, campaignPhase]
);

useEffect(() => {
  const graph = serializeDesign(nodes, edges);
  if (nodes.length === 0 && edges.length === 0) return;
  debouncedCloudSave(graph);
  return () => debouncedCloudSave.cancel();
}, [nodes, edges, debouncedCloudSave]);
```

Flush on:

- `visibilitychange` → hidden  
- `beforeunload` (best-effort `navigator.sendBeacon` only if we add a tiny API; otherwise last debounce)  
- Campaign phase transitions (evaluate / wrench / pass)

### 5.5 Multi-tab

- Use `storage` event on localStorage keys to rehydrate other tabs for campaign/training.
- For designs: last write wins by `updated_at`; no fancy OT in v1.
- Optional: `BroadcastChannel('sdl-progress')` to notify tabs after merge.

---

## 6. API surface

### 6.1 Recommendation

**Prefer Supabase JS client direct + RLS** for CRUD.

| Approach | Pros | Cons |
|----------|------|------|
| **Supabase client + RLS (recommended)** | Least glue; realtime later; matches Supabase Auth; types via generated DB types | Merge logic must be careful on client (or RPC) |
| Next.js API routes proxy | Central validation, hide schema, easier rate limits | More code; double hop; session plumbing |

**Justify:** Progress payloads are user-owned, not multi-tenant business logic. RLS already enforces `auth.uid()`. Auth is Supabase; using the same client avoids dual session models. Rate limiting for **AI** stays on Next routes (`/api/evaluate`, `/api/wrench`); progress writes are cheap JSON upserts.

Use a **Postgres RPC** for atomic merge if client race becomes an issue:

```sql
CREATE OR REPLACE FUNCTION merge_campaign_progress(
  p_completed TEXT[],
  p_stars JSONB,
  p_wrenches INT,
  p_last_played TEXT
)
RETURNS campaign_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  row campaign_progress;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO campaign_progress AS cp (user_id, completed_level_ids, stars, wrenches_survived, last_played_level_id)
  VALUES (uid, COALESCE(p_completed, '{}'), COALESCE(p_stars, '{}'::jsonb), COALESCE(p_wrenches, 0), p_last_played)
  ON CONFLICT (user_id) DO UPDATE SET
    completed_level_ids = (
      SELECT ARRAY(SELECT DISTINCT unnest(cp.completed_level_ids || EXCLUDED.completed_level_ids))
    ),
    stars = (
      -- jsonb merge max per key (simplified: client can also merge; v1 RPC can call helper)
      cp.stars || EXCLUDED.stars  -- tighten with max-per-key function in implementation
    ),
    wrenches_survived = GREATEST(cp.wrenches_survived, EXCLUDED.wrenches_survived),
    last_played_level_id = COALESCE(EXCLUDED.last_played_level_id, cp.last_played_level_id),
    updated_at = now()
  RETURNING * INTO row;

  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION merge_campaign_progress FROM PUBLIC;
GRANT EXECUTE ON FUNCTION merge_campaign_progress TO authenticated;
```

**v1 shipping choice:**

1. Client-side pure merge (`mergeCampaignProgress`) + upsert full row after merge (simpler).  
2. Add RPC when multi-device races show up in testing.

### 6.2 Supabase table operations (client)

```ts
// Campaign upsert
await supabase.from("campaign_progress").upsert({
  user_id: user.id,
  completed_level_ids: progress.completedLevelIds,
  stars: progress.stars,
  wrenches_survived: progress.wrenchesSurvived,
  last_played_level_id: progress.lastPlayedLevelId ?? null,
  attempt_context: progress.attemptContext ?? null,
  schema_version: 1,
});

// Training upsert
await supabase.from("training_progress").upsert({
  user_id: user.id,
  completed_lesson_ids: progress.completedLessonIds,
  last_lesson_id: progress.lastLessonId ?? null,
  schema_version: 1,
});

// Autosave upsert — prefer unique partial index + onConflict
await supabase.from("saved_designs").upsert(
  {
    user_id: user.id,
    title: null,
    problem_id: problemId,
    campaign_level_id: campaignLevelId ?? null,
    graph,
    status: "draft",
    is_autosave: true,
    campaign_phase: phase ?? null,
    metadata: metadata ?? {},
    schema_version: 1,
  },
  {
    // Requires matching unique constraint / careful upsert key strategy
    onConflict: "/* implement via select-then-update if partial unique is awkward */",
  }
);
```

**Practical note:** Partial unique indexes and PostgREST `onConflict` can be awkward. Acceptable v1 pattern:

1. `select id from saved_designs where user_id = ? and is_autosave and problem_id = ? and campaign_level_id is not distinct from ?`  
2. If found → `update`; else → `insert`.

### 6.3 Optional Next.js routes (not required for v1)

| Route | When to add |
|-------|-------------|
| `POST /api/progress/merge` | If merge must run server-side for audit |
| `GET /api/progress/export` | GDPR export later |
| `DELETE /api/progress` | Account wipe later |

---

## 7. TypeScript type extensions

### 7.1 Extend existing client types carefully

Keep local shapes stable so offline code stays simple; extend remote/service layers.

```ts
// src/lib/types.ts — existing CampaignProgress stays the localStorage shape
export interface CampaignProgress {
  completedLevelIds: string[];
  stars: Record<string, number>;
  wrenchesSurvived: number;
  lastPlayedLevelId?: string;
}

// Optional additive fields for in-memory use (not required on disk v1)
export interface CampaignProgressState extends CampaignProgress {
  attemptContext?: AttemptContext;
}
```

```ts
// src/lib/training-lessons.ts — keep TrainingProgress; service maps to snake_case DB
export interface TrainingProgress {
  completedLessonIds: string[];
  lastLessonId?: string;
}
```

### 7.2 Generated DB types

After migrations, generate Supabase types:

```bash
npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
```

Map columns:

| DB | TS |
|----|-----|
| `completed_level_ids` | `completedLevelIds` |
| `wrenches_survived` | `wrenchesSurvived` |
| `last_played_level_id` | `lastPlayedLevelId` |
| `campaign_level_id` | `campaignLevelId` |
| `is_autosave` | `isAutosave` |

### 7.3 Schema versioning

- Every progress table has `schema_version INT DEFAULT 1`.
- Client reads `schema_version`; if remote > client, show soft “refresh the app” banner (no hard fail).
- If client > remote, write new version on next upsert (forward compatible fields only).
- localStorage keys keep `-v1` suffix; bump key (`-v2`) only on breaking local shape changes, with a one-shot reader for old key.

---

## 8. Migration path from localStorage

### 8.1 First login merge algorithm

Run once per browser session after auth is ready (and again if local keys change while signed in — cheap idempotent merge).

```
1. session = await getSession()
2. if !session → return (guest mode)

3. localC = loadProgress()           // campaign localStorage
4. localT = loadTrainingProgress()
5. remoteC = fetch campaign_progress for user (or empty defaults)
6. remoteT = fetch training_progress for user (or empty defaults)

7. mergedC = mergeCampaignProgress(localC, remoteC)
8. mergedT = mergeTrainingProgress(localT, remoteT)

9. saveProgress(mergedC)             // write local cache
10. saveTrainingProgress(mergedT)
11. upsert remote campaign + training with merged

12. progress_meta.last_merged_at = now()

13. Optionally merge design autosaves:
    - For each local key sdl-design-autosave-v1:*
    - If remote autosave missing OR local.updatedAt > remote.updatedAt → upsert local graph
    - Else keep remote (and overwrite local cache with remote for resume consistency)

14. UI: toast / banner “Progress from this device was saved to your account.”
    only if local had non-empty completions/stars not already in remote
```

### 8.2 Invariants (never lose stars)

| Field | Rule |
|-------|------|
| `completedLevelIds` / `completedLessonIds` | Set union |
| `stars[levelId]` | `max(local, remote)` |
| `wrenchesSurvived` | `max(local, remote)` (v1; not perfect if both advanced offline, acceptable) |
| `lastPlayedLevelId` / `lastLessonId` | Prefer local if present else remote (or newer timestamp if we add one) |
| Designs | Prefer newer `updatedAt`; never delete remote named saves on merge |

### 8.3 Reset controls

- Existing UI that clears campaign localStorage (`CampaignMap` reset) must:

  1. Clear local keys  
  2. If signed in, upsert empty remote **or** require confirm “Reset cloud progress too?”  

**v1 recommendation:** reset is **device-only** unless user confirms “also clear account progress.”

### 8.4 Do not delete local after merge

Keep localStorage as write-through cache so offline and signed-out bounce still work.

---

## 9. Privacy / data retention

| Topic | Policy (draft) |
|-------|----------------|
| What we store | Progress ids, stars, design graphs, attempt metadata — no payment data in these tables |
| PII | Only via `auth.users` (email etc.); progress tables are pseudonymous UUIDs |
| Access | User-only via RLS; staff only with service role for support |
| Retention | Kept while account exists; cascade delete on `auth.users` delete |
| Export | Later: JSON export of progress + designs (GDPR) |
| Backups | Supabase automated backups; RPO per plan |
| Analytics | Prefer aggregate events; do not ship full graphs to third-party analytics |
| AI routes | Designs sent to evaluate/wrench APIs remain request-scoped; not auto-persisted by those routes |

Surface in privacy policy when auth ships: “We store your campaign progress, training completion, and design diagrams you create so you can resume across devices.”

---

## 10. Edge cases

| Case | Behavior |
|------|----------|
| **Guest mode** | Full play; local only; “Sign in to save” soft CTAs |
| **Guest → sign-in** | Merge algorithm; banner if local had progress |
| **Sign-in on empty device** | Remote hydrate → local cache filled |
| **Multi-tab** | localStorage `storage` events; designs last-write-wins |
| **Multi-device simultaneous** | Same merge rules on next focus/login; stars max wins |
| **Offline signed-in** | Local writes; sync status offline; retry upsert on reconnect |
| **Partial failure mid-merge** | Local already merged; retry remote upsert; idempotent |
| **Schema version skew** | Soft banner; don’t crash |
| **Corrupt local JSON** | Catch → defaults (existing pattern); don’t overwrite remote with empty without user confirm |
| **Huge graph** | Cap / toast; still save campaign progress |
| **Quota exceeded (later billing)** | Block new named saves; autosave still allowed for active level |
| **User deletes account** | FK cascade removes progress rows |
| **Clock skew** | Prefer server `updated_at` for design conflict; don’t trust client clocks alone |

---

## 11. UI

### 11.1 Save / sync indicators

| State | UI |
|-------|-----|
| Guest | Subtle: “Progress saved on this device only” |
| Syncing | Spinner / “Saving…” in design chrome or campaign header |
| Saved | Checkmark “Saved” (fade after 2s) |
| Offline | “Offline — will sync when online” |
| Error | “Couldn’t sync — retry” + retry button |

Placement:

- **Design workspace** top bar or evaluation panel strip  
- **Campaign map** near stars / wrenches  
- **Training** list footer or header  

### 11.2 Sign-in CTAs

Copy:

- Campaign: **“Sign in to save progress across devices”**  
- After first level clear (dismissible modal): **“Nice clear! Sign in so you don’t lose your stars.”**  
- Design canvas (guest, after N edits): **“Sign in to resume this design later.”**  
- Button: reuse auth CTA from supabase-auth spec (e.g. **Continue with Google**)

### 11.3 Resume banner

When opening `/design/[problemId]?campaign=…` (or free practice) and an autosave exists with non-empty graph:

> **Resume your design?** Last saved {relative time}.  
> [Resume] [Start fresh]

- **Resume** → load graph (+ phase if stored)  
- **Start fresh** → keep remote autosave until first new edit overwrites, or archive previous draft in metadata  

Also on campaign map: if `lastPlayedLevelId` and incomplete, chip:

> **Continue: {mapLabel}** → deep link via existing `campaignHref`

### 11.4 Merge banner

After first successful merge with local wins:

> “We found progress on this device and merged it into your account.”

Dismissible; store `localStorage sdl-merge-banner-acked` or use `progress_meta`.

---

## 12. Testing matrix

| # | Case | Expected |
|---|------|----------|
| 1 | Guest completes level | localStorage only; stars show on map |
| 2 | Guest signs in with empty cloud | local → cloud; same stars |
| 3 | Cloud has stars; local empty | hydrate local; map shows cloud stars |
| 4 | Local star 2, cloud star 3 same level | result star 3 |
| 5 | Local completed A; cloud completed B | both completed |
| 6 | Offline level complete then reconnect | upsert succeeds; cloud matches |
| 7 | Two devices offline diverge then both online | union + max stars; no crash |
| 8 | Autosave after node drag | debounce fires; reload restores positions |
| 9 | Resume banner Start fresh | empty canvas; next edit writes new autosave |
| 10 | Multi-tab campaign complete | other tab updates via storage event (or next focus) |
| 11 | Sign out mid-design | local autosave remains; no further cloud writes |
| 12 | RLS isolation | user B cannot select user A rows (SQL test + client) |
| 13 | Corrupt local JSON | defaults; remote intact |
| 14 | Training complete guest → login | lesson ids merged |
| 15 | Reset device only | local cleared; cloud retained unless confirmed |
| 16 | Large graph near limit | warning; progress still saves |

Automated:

- Unit: `mergeCampaignProgress`, `mergeTrainingProgress` pure functions  
- Integration: Supabase local/dev project with two users for RLS  
- E2E (Playwright later): login → complete → logout → login other browser profile  

---

## 13. Rollout phases

| Phase | Work | Est. | Ships |
|-------|------|------|-------|
| **P0** | Depends: Supabase Auth session available in app | — | Auth spec |
| **P1** | SQL migrations + RLS + `database.types` | 0.5 d | Empty tables |
| **P2** | `ProgressService` campaign + training load/save/merge; wire `markLevelComplete` / `markLessonComplete` | 1–1.5 d | Cross-device stars/lessons |
| **P3** | Soft CTAs + merge banner + sync indicators | 0.5 d | UX |
| **P4** | Design autosave local + cloud; resume banner | 1 d | Mid-level resume |
| **P5** | `attempt_context` / `level_attempts` optional | 0.5–1 d | Richer resume |
| **P6** | Design library UI, export, quotas | later | Portfolio / billing |

Feature flag (optional): `NEXT_PUBLIC_PROGRESS_SYNC=1` to enable cloud writes while developing.

### Implementation checklist

**Prerequisite:** [supabase-auth.md](./supabase-auth.md) **P0–P1** done (session + `public.user` trigger). Do not implement cloud writes without a real `auth.uid()`.

#### P0 — Gate on auth

- [ ] Confirm signed-in session works in browser (`createBrowserClient`) and server (`createServerClient`)
- [ ] Confirm `public.user` row exists for test account
- [ ] Decide feature flag: `NEXT_PUBLIC_PROGRESS_SYNC=1` (optional but recommended)
- [ ] Document dependency in PR description when starting Progress P1

**P0 exit:** Auth ready; progress code can call `supabase.auth.getUser()`.

#### P1 — Schema + types

- [ ] Write SQL migration: `progress_meta`, `campaign_progress`, `training_progress`, `saved_designs` (+ indexes / unique autosave slot)
- [ ] Optional later tables stubbed or deferred: `level_attempts`
- [ ] Enable RLS on every new table; policies: select/insert/update/delete own rows via `auth.uid() = user_id`
- [ ] Run migration in Supabase SQL editor or CLI
- [ ] Generate or hand-write TypeScript DB types (`database.types.ts` or Zod schemas matching columns)
- [ ] Smoke: signed-in client can `upsert` a dummy `campaign_progress` row; signed-out cannot

**P1 exit:** Empty tables + RLS verified.

#### P2 — Campaign + training sync core

- [ ] Add `src/lib/progress/` (or equivalent): pure `mergeCampaignProgress` / `mergeTrainingProgress` (union ids, max stars, max wrenches)
- [ ] Unit tests for merge edge cases (empty local, empty remote, star max, no id drops)
- [ ] `ProgressService.loadCampaign` / `saveCampaign` — read cloud, write-through localStorage
- [ ] `ProgressService.loadTraining` / `saveTraining` — same pattern
- [ ] On login / session start: load cloud → merge local → write both ways
- [ ] Wire `markLevelComplete` in `campaign.ts` to call service when signed in
- [ ] Wire `markLessonComplete` in training module when signed in
- [ ] Guest path unchanged (localStorage only when no session)
- [ ] Manual: complete level on browser A; login browser B; completions + stars match

**P2 exit:** Cross-device campaign + training progress works.

#### P3 — UX chrome for sync

- [ ] Campaign map: “Sign in to save” soft CTA (reuse auth SoftAuthPrompt if present)
- [ ] Training hub: same
- [ ] Merge banner once per session after first login merge (“Progress merged from this device”)
- [ ] Subtle save/sync indicator (saving / saved / offline error)
- [ ] Sync failure toast does **not** clear localStorage
- [ ] Optional: last-synced timestamp in a debug footer or account menu

**P3 exit:** User understands when progress is cloud-saved.

#### P4 — Design graph autosave + resume

- [ ] Define autosave key: user + `problem_id` + optional `campaign_level_id`
- [ ] Debounced local save of `DesignGraph` (e.g. 500–1000ms) while editing
- [ ] When signed in: debounced upsert to `saved_designs` (`is_autosave = true`, status `draft`)
- [ ] On design page mount: if draft exists, show **Resume** / **Start fresh** banner
- [ ] Resume loads nodes/edges into React Flow
- [ ] Start fresh archives or overwrites previous autosave (pick one; document)
- [ ] Campaign phase in `campaign_phase` column when available
- [ ] Guest: local-only autosave still works if you already store drafts (or add local draft key)

**P4 exit:** Refresh mid-level can restore graph for signed-in users.

#### P5 — Attempt context / history (optional)

- [ ] Persist `attempt_context` JSON on `campaign_progress` (phase, wrench index, last score)
- [ ] Optional table `level_attempts` for pass/fail history
- [ ] Resume restores wrench phase when safe
- [ ] Avoid double-counting `wrenches_survived` on merge (document max vs sum decision)

**P5 exit:** Richer resume without breaking P2 progress.

#### P6 — Design library + quotas (later)

- [ ] Named saves UI (`is_autosave = false`, titles)
- [ ] List / open / delete own designs
- [ ] Export JSON
- [ ] Quotas by plan (count rows or storage) once billing exists
- [ ] Do not block v1 learning loop on this phase

#### Verification (run before calling progress “done”)

- [ ] All acceptance criteria in §14 pass
- [ ] RLS: second user cannot read first user’s rows
- [ ] No service-role key in client
- [ ] Offline / failed network: local progress intact
- [ ] Multi-tab: last write wins or documented behavior

---

## 14. Acceptance criteria

1. Signed-in user completes a campaign level on device A; device B after login shows same completions and stars (≥ max of both histories).  
2. Signed-in user completes a training lesson; other device shows it completed.  
3. First login after guest play **merges** localStorage; no star decrease; no completed id dropped.  
4. Guest mode still plays end-to-end without auth.  
5. localStorage remains populated as cache after cloud sync.  
6. RLS: authenticated user can only read/write own rows (verified).  
7. Design autosave (P4): refresh mid-level restores graph when user chooses Resume.  
8. Sync failure does not wipe local progress.  
9. UI shows sign-in prompt on campaign/training for guests; save indicator when signed in.  
10. No service-role key in client bundle.  
11. Depends only on Supabase Auth session; no parallel ad-hoc user ids.  

---

## 15. Open questions

1. **Wrench counter double-count:** `wrenchesSurvived` uses `max` on merge — if both devices add offline, true sum is higher. Accept for v1 or switch to attempt log sum later?  
2. **Trust client scores?** Server-side re-validation of pass/stars not in v1 — OK for learning product?  
3. **Autosave for free practice only vs campaign only vs both?** Recommendation: both.  
4. **Start fresh** — archive previous autosave or hard overwrite?  
5. **Guided builds** — share `training_progress` or separate table?  
6. **Realtime** Supabase channel for multi-tab — worth it v1? Recommendation: no; storage events enough.  
7. **Align google-auth.md tables** with this Supabase-native schema (google-auth still mentions Auth.js/Prisma). Treat **this doc + supabase-auth** as source of truth for progress.  

---

## 16. Dependencies

| Dependency | Relationship |
|------------|--------------|
| **`.vscode/specs/supabase-auth.md`** | Required — identity, **Proxy** session, `public.user` auto-create, `auth.uid()` for RLS |
| **`public.user`** | Must exist before meaningful progress UX; progress FKs still on `auth.users` (same id) |
| **This spec** | Progress tables, merge, autosave |
| **Future billing** | Quotas on `saved_designs` counts / AI by `user_id` |
| **AI routes** | May require auth + read progress only for personalization later; not blocked by this |
| **Existing client** | `src/lib/campaign.ts`, `src/lib/training-lessons.ts`, `src/lib/types.ts` (`DesignGraph`), `serializeDesign` |

### Current code anchors

- Campaign storage key: `sdl-campaign-progress-v1` (`src/lib/campaign.ts`)  
- Training storage key: `sdl-training-progress-v1` (`src/lib/training-lessons.ts`)  
- `CampaignProgress` / `DesignGraph` / `CampaignPhase`: `src/lib/types.ts`  
- Design entry: `src/app/design/[problemId]/page.tsx` + `DesignWorkspace`  
- Related earlier sketch: `docs/specs/google-auth.md` §6 (superseded for auth stack; progress ideas aligned)

---

## 17. References

- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security  
- Supabase JS upsert: https://supabase.com/docs/reference/javascript/upsert  
- React Flow state serialization (app): `src/lib/serialize-design.ts`  
- Product viability notes: `docs/market-research-viability.md` (auth + progress as prerequisite for paid)

---

## Appendix A — Column ↔ client field map

### campaign_progress

| Column | Client |
|--------|--------|
| `user_id` | session user id |
| `completed_level_ids` | `completedLevelIds` |
| `stars` | `stars` |
| `wrenches_survived` | `wrenchesSurvived` |
| `last_played_level_id` | `lastPlayedLevelId` |
| `attempt_context` | `attemptContext` |
| `schema_version` | `schemaVersion` |
| `updated_at` | `updatedAt` |

### training_progress

| Column | Client |
|--------|--------|
| `completed_lesson_ids` | `completedLessonIds` |
| `last_lesson_id` | `lastLessonId` |

### saved_designs

| Column | Client |
|--------|--------|
| `problem_id` | `problemId` |
| `campaign_level_id` | `campaignLevelId` |
| `graph` | `DesignGraph` |
| `is_autosave` | `isAutosave` |
| `campaign_phase` | `CampaignPhase` |

---

## Appendix B — Example merge unit tests (sketch)

```ts
describe("mergeCampaignProgress", () => {
  it("unions completed levels", () => {
    const m = mergeCampaignProgress(
      { completedLevelIds: ["a"], stars: {}, wrenchesSurvived: 0 },
      { completedLevelIds: ["b"], stars: {}, wrenchesSurvived: 0 }
    );
    expect(m.completedLevelIds.sort()).toEqual(["a", "b"]);
  });

  it("takes max stars per level", () => {
    const m = mergeCampaignProgress(
      { completedLevelIds: ["a"], stars: { a: 2 }, wrenchesSurvived: 1 },
      { completedLevelIds: ["a"], stars: { a: 3 }, wrenchesSurvived: 4 }
    );
    expect(m.stars.a).toBe(3);
    expect(m.wrenchesSurvived).toBe(4);
  });

  it("never drops a star when remote empty", () => {
    const m = mergeCampaignProgress(
      { completedLevelIds: ["a"], stars: { a: 2 }, wrenchesSurvived: 2 },
      { completedLevelIds: [], stars: {}, wrenchesSurvived: 0 }
    );
    expect(m.stars.a).toBe(2);
  });
});
```
