# System Design Lab — Agent Entry

> Read this file first. Then follow **Mandatory read order**.  
> **Before writing any code**, print the feature board (see below). Do not skip.

## Mandatory read order

1. `docs/brain/PRODUCT.md` — what / why
2. `docs/brain/FEATURES.md` — full shipped inventory (do not reimplement)
3. `docs/brain/BOARD.md` — ASCII feature list + parallel branch status (**print before work**)
4. `docs/brain/STATUS.md` — handoff notes / next actions; verify with `git worktree list`
5. `docs/brain/MAINTENANCE.md` — only when creating/merging work or changing the brain

## BEFORE you begin work (required)

Do this in chat **before** the first file edit or implementation command:

1. Read `docs/brain/BOARD.md`.
2. Run: `git worktree list` and `git branch --show-current` (and `gh pr list --state open` if `gh` works).
3. **Paste an ASCII summary** for the human, using this shape:

```
FEATURE BOARD (pre-work)
========================
Building / planned:
  [~] <feature>  branch:feat/...  worktree:...  next:<step>
  [ ] <feature>  (not started)

Parallel status:
  <branch>  <worktree>  <tip>  CURRENT|STALE|AHEAD  <note>
  ...

This session will work on: <one feature>
Branch: <feat/...>   Worktree: <path or basename>
```

4. If BOARD/STATUS is stale vs `git worktree list`, refresh BOARD + STATUS on **main** first (or call out the drift in the summary).
5. Only then implement.

If the human asked a pure question (no implementation), a short board glance is enough — still cite BOARD if recommending next work.

## Feature branches (parallel agents) — hard rules

Multiple agents / worktrees / features **must not** share one branch or pile edits onto `main`.

| Rule | Detail |
| --- | --- |
| **One feature → one branch** | Name: `feat/<short-kebab>` (docs-only: `docs/<short-kebab>`). Never invent a second agent on an existing in-flight branch without human OK. |
| **No feature work on `main`** | `main` is for merges, STATUS/BOARD intent updates, and tiny brain hygiene. Product code lands on a feature branch. |
| **Parallel agents → separate worktrees** | If another agent already has an Active / IN FLIGHT feature, create a **new worktree** for your branch: `git worktree add ../system-design-lab-<name> -b feat/<name> main` (from an up-to-date main). |
| **Claim work on main first** | Before coding: add IN FLIGHT row on `docs/brain/BOARD.md` + Active row on `docs/brain/STATUS.md` **on main** (tiny commit), then create the feature branch/worktree. |
| **Do not steal a branch** | If BOARD shows `[~]` on `feat/foo`, do not checkout `feat/foo` for a different task. Pick a free feature or ask the human. |
| **Stay on your branch** | All commits for that feature stay on that branch until PR/merge. |
| **Update board when you stop** | End of session: factual handoff on STATUS; BOARD next-step line updated. |
| **Ship with FEATURES** | User-visible behavior → update `docs/brain/FEATURES.md` in the **same** PR; move board row to shipped after merge. |

### Starting a new feature (checklist)

```text
[ ] Print ASCII board (BEFORE you begin work)
[ ] Confirm feature is not already in FEATURES.md
[ ] Confirm no other agent owns the same workstream on BOARD
[ ] On main: add BOARD IN FLIGHT + STATUS Active row
[ ] git fetch && git checkout main && git pull
[ ] git worktree add ../system-design-lab-<name> -b feat/<name> main
    (or: git checkout -b feat/<name> if single-tree only)
[ ] Implement only on feat/<name>
[ ] PR → merge → clear Active / move BOARD row → prune worktree if done
```

### Forbidden

- Two agents committing different features on the same branch
- Long-lived product WIP committed only on `main`
- Ignoring IN FLIGHT rows and starting a duplicate feature
- Using a STALE worktree (tip ancestor of main) as if it were active work

## Quick facts

- Stack: Next.js 16 App Router, React 19, React Flow, AI SDK + xAI `grok-4.5`, Supabase
- Concept: system design **teaching game** — learn (Training) → Practice → **two play modes:**
  - **Solo Mode** (`/solo`) — personal multi-problem levels (see FEATURES)
  - **Campaign** (`/campaign`) — competitive **3-day seasons** + leaderboard (not shipped until FEATURES)
- Shipped “campaign map” + wrenches = **legacy pre mode-split** progress game — do not equate with season LB
- Mode SSOT: `docs/brain/PRODUCT.md` + `docs/specs/solo-vs-campaign.md` (scoring `v1_correct_diff_cover`)
- Plan B (constraint engine) **parked** — do not implement
- Env: `XAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Progress: localStorage always (`sdl-*-progress-v1`) + Supabase when signed in
- STATUS/BOARD Active work is maintained **on main**; git tips are ground truth for worktrees

## Do not reimplement (already on main)

- Free practice (16 problems) + component catalog (54 types)
- Design canvas + `POST /api/evaluate` (SpaceXAI)
- Campaign map (15 levels / 4 worlds) + `POST /api/wrench`
- Training (16 lessons) + guided builds (5)
- Animated data-flow playback (`DataFlowPlayer` P0/P1)
- Supabase Google auth, session proxy, progress APIs + merge-on-login
- See `docs/brain/FEATURES.md` for files and IDs

## Tooling notes

- Edit FEATURES in the **same PR** that ships a feature (`docs/brain/MAINTENANCE.md`)
- Edit BOARD + STATUS Active rows **on main** (solo multi-worktree / multi-agent protocol)
- Do not put product rules inside the Next.js marker block below

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
