# Feature board (ASCII)

> **Agents: print this entire file (or the live sections below) in chat BEFORE any implementation.**  
> Keep this file on **`main`**. Update when starting, pausing, or finishing a feature.  
> Last updated: 2026-08-09

States: `[ ]` planned · `[~]` in progress · `[x]` done (also listed in FEATURES) · `[-]` blocked · `[!]` needs human

## Features I'm building (product roadmap)

```
SYSTEM DESIGN LAB — FEATURE BOARD
=================================
Last updated: 2026-08-09

SHIPPED (summary — full detail in FEATURES.md)
  [x] System design canvas + 16 problems + component catalog
  [x] SpaceXAI evaluate API (scores + Socratic interview)
  [x] Campaign map + wrenches + unlocks (solo progress game — pre mode-split)
  [x] Training lessons + guided builds (learn loop)
  [x] Animated data-flow playback (P0/P1)
  [x] Supabase Google auth + progress sync
  [x] Marketing docs (IG/X + video brief)
  [x] Application brain + multi-agent board protocol (PR #8/#9)

IN FLIGHT
  [~] Artifact 0: Solo vs Campaign product vocabulary (docs)
      branch:   docs/solo-campaign-modes
      worktree: system-design-lab-docs-solo-campaign
      issue:    #13
      next:     PRODUCT + solo-vs-campaign spec + BOARD rows 0–7 + AGENTS; open docs PR

PLANNED (not started — pick one, open a feature branch)
  [ ] Artifact 1: App nav + route shells (/solo, /campaign, /practice)  #16  depends: #13
  [ ] Artifact 2: Solo multi-problem levels + progress + duration       #11  depends: #16
  [ ] Artifact 3: Catalog schema + AI generate 20 campaign prompts      #15  depends: #13  ∥ #11
  [ ] Artifact 4: Campaign seasons DB schema + RLS                      #14  depends: #13 (seed after #15)
  [ ] Artifact 5: Campaign submit API + scoring                         #17  depends: #15 #14
  [ ] Artifact 6: Campaign season UI + leaderboard                      #12  depends: #17
  [ ] Artifact 7: Campaign hardening (limits, end, reveal)              #10  depends: #12
  note: Plan B (constraint engine) PARKED — do not start

BLOCKED
  (none)
```

## Parallel work — branch / worktree status

```
PARALLEL STATUS
===============
Run also: git worktree list && gh pr list --state open

BRANCH / WORKSTREAM              WORKTREE                 TIP      vs MAIN   STATE
-------------------------------  -----------------------  -------  --------  -----------
main                             system-design-lab        ce98b6f  CURRENT   claim edits
docs/solo-campaign-modes         (worktree on claim)      —        missing   #13 IN FLIGHT
feat/auth-supabase-p0            system-design-lab-auth-p0 d611fa9  STALE     prune
feat/map-flavor-p0               system-design-lab-map-p0  b18513b  STALE     prune
docs/marketing-campaign          system-design-lab-marketing 5bcb8d0 STALE    prune

Open PRs: (none)
```

## How to add a feature to this board

When you **start** building something:

1. Add under **IN FLIGHT** with `[~]`, branch name, worktree basename, one-line next step.
2. Add a matching Active row in `STATUS.md`.
3. Create `feat/<short-name>` (or `docs/…` for docs-only) **before** writing product code.
4. Prefer a **dedicated worktree** when another agent already has an active feature branch.

When you **finish**:

1. Move to SHIPPED as `[x]` (or delete from IN FLIGHT if folded into FEATURES only).
2. Update `FEATURES.md` in the same PR.
3. Clear Active row in `STATUS.md` after merge.

## Template (copy for new rows)

```
  [~] <Feature title>
      branch:   feat/<name>
      worktree: system-design-lab-<name>
      agent:    <tool or session id if known>
      next:     <one concrete step>
```
