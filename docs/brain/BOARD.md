# Feature board (ASCII)

> **Agents: print this entire file (or the live sections below) in chat BEFORE any implementation.**  
> Keep this file on **`main`**. Update when starting, pausing, or finishing a feature.  
> Last updated: 2026-08-08

States: `[ ]` planned · `[~]` in progress · `[x]` done (also listed in FEATURES) · `[-]` blocked · `[!]` needs human

## Features I'm building (product roadmap)

```
SYSTEM DESIGN LAB — FEATURE BOARD
=================================
Last updated: 2026-08-08

SHIPPED (summary — full detail in FEATURES.md)
  [x] System design canvas + 16 problems + component catalog
  [x] SpaceXAI evaluate API (scores + Socratic interview)
  [x] Campaign map + wrenches + unlocks (solo progress game)
  [x] Training lessons + guided builds (learn loop)
  [x] Animated data-flow playback (P0/P1)
  [x] Supabase Google auth + progress sync
  [x] Marketing docs (IG/X + video brief)

IN FLIGHT
  [~] Positioning: teaching game = learn + campaign compete
      branch:  docs/application-brain
      worktree: system-design-lab
      next:     commit + push PR #8

PLANNED (not started — pick one, open a feature branch)
  [ ] 3-day campaign seasons + highest-score competition / leaderboards
      note: vision only — needs auth, score integrity, event windows

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
main                             system-design-lab        d9b5e78  CURRENT   docs WIP (brain)
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
