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
  [x] Artifact 0: Solo vs Campaign vocabulary (PR #18 / #13)
  [x] Artifact 1: App nav + route shells (PR #19 / #16)
  [x] Artifact 3: Catalog schema + 20 season prompts fixture (PR #20 / #15)

IN FLIGHT
  [~] Artifact 2: Solo multi-problem levels + progress + duration
      branch:   feat/solo-multi-problem
      worktree: system-design-lab-solo
      issue:    #11
      next:     SOLO_LEVELS + progress APIs + hub UI + canvas complete; no wrenches

  [~] Artifact 4: Campaign seasons DB schema + RLS
      branch:   feat/campaign-seasons-db
      worktree: system-design-lab-seasons-db
      issue:    #14
      next:     migrations profiles/seasons/prompts/sessions/attempts/scores + seed from fixture
      note:     parallel-safe with #11; no solo tables

PLANNED
  [ ] Artifact 5: Campaign submit API + scoring                         #17  depends: #15 #14
  [ ] Artifact 6: Campaign season UI + leaderboard                      #12  depends: #17
  [ ] Artifact 7: Campaign hardening                                    #10  depends: #12
  note: Plan B PARKED
  note: scoring v1_correct_diff_cover (solo-vs-campaign.md)

BLOCKED
  (none)
```

## Parallel work — branch / worktree status

```
PARALLEL STATUS
===============
main                             system-design-lab        c941853  CURRENT   claims
feat/solo-multi-problem          (implementer)            —        missing   #11
feat/campaign-seasons-db         (implementer)            —        missing   #14
STALE worktrees: auth-p0, map-p0, marketing — prune
Open PRs: (none at claim)
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
