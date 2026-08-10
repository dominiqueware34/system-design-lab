# Feature board (ASCII)

> **Agents: print this entire file (or the live sections below) in chat BEFORE any implementation.**  
> Keep this file on **`main`**. Update when starting, pausing, or finishing a feature.  
> Last updated: 2026-08-10 · **Roadmap reordered for validation-first** (advisor)

States: `[ ]` planned · `[~]` in progress · `[x]` done (also listed in FEATURES) · `[-]` blocked · `[!]` needs human · `[P]` parked

## Features I'm building (product roadmap)

```
SYSTEM DESIGN LAB — FEATURE BOARD
=================================
Last updated: 2026-08-10
Priority rule: prove users + seasons before more product depth.

SHIPPED (summary — full detail in FEATURES.md)
  [x] System design canvas + 16 problems + component catalog
  [x] SpaceXAI evaluate API (scores + Socratic interview)
  [x] Campaign map + wrenches + unlocks (legacy solo-progress game)
  [x] Training lessons + guided builds (learn loop)
  [x] Animated data-flow playback (P0/P1)
  [x] Supabase Google auth + progress sync
  [x] Marketing docs (IG/X + video brief) — MESSAGE MAY LAG mode split
  [x] Application brain + multi-agent board protocol (PR #8/#9)
  [x] Artifact 0: Solo vs Campaign vocabulary (PR #18 / #13)
  [x] Artifact 1: App nav + route shells (PR #19 / #16)
  [x] Artifact 3: Catalog schema + 20 season prompts fixture (PR #20 / #15)
  [x] Artifact 4: Campaign seasons DB schema + RLS (PR #21 / #14)
  [x] Artifact 2: Solo multi-problem levels + progress + duration (PR #22 / #11)
  [x] Artifact 5: Campaign submit API + scoring (PR #23 / #17)
  [x] Artifact 6: Campaign season UI + leaderboard (PR #24 / #12)
  [x] Artifact 7 (reduced): season freeze + ref reveal API (PR #27 / #10)

IN FLIGHT
  (none)

--------------------------------------------------------------------
NOW — Phase 0: stabilize story + run product (founder / ops)
--------------------------------------------------------------------
  [!] Live Campaign season seeded and playable (manual OK)       human
  [!] Manual E2E pass (all paths)  docs/testing/manual-e2e-plan.md  human
  [ ] Marketing / positioning sync to Solo + Campaign seasons
      (demote legacy map+wrench as primary hook)
  [ ] Prune STALE worktrees (auth-p0, map-p0, marketing)
  note: do these before building new product features

--------------------------------------------------------------------
NEXT — Phase 1: validation (2–4 weeks; product + light eng)
--------------------------------------------------------------------
  [ ] Soft free AI evaluate quota (cost + future Pro floor)
  [ ] Funnel / session metrics (hub → first evaluate → Solo → Campaign)
  [ ] Run 1 full 3-day season with real players; capture feedback
  note: success signals in PRODUCT.md + advisor notes in STATUS
  note: no new primary modes until funnel data exists

--------------------------------------------------------------------
THEN — Phase 2: retention (after Phase 1 signal)
--------------------------------------------------------------------
  [ ] Solo depth (levels 3–4 or richer L1/L2 content)
  [ ] Campaign operator next-season seed                        #26
  [ ] Campaign rate limits / abuse protection                   #25
  [ ] Share moments (flow clips / season score share) — optional

--------------------------------------------------------------------
LATER / optional
--------------------------------------------------------------------
  [ ] Season-end DB status persistence (owner; not Queues+EF)
  [ ] Legacy map path retire or re-scope (?campaign=w*)
  [ ] Content APIs fully off constants (if ops needs it)

PARKED
  [P] Plan B constraint engine — do not implement
  [P] Season DB status expire via Queues+EF (#28 closed not_planned)

BLOCKED
  (none)

LOCKED RULES
  scoring: v1_correct_diff_cover (docs/specs/solo-vs-campaign.md)
  Campaign: auth required · max 3 attempts · time private · no wrenches v1
  Solo: personal levels · no public rank · no wrenches v1
```

## Parallel work — branch / worktree status

```
PARALLEL STATUS
===============
main                             system-design-lab              b2bd635  CURRENT
STALE worktrees: auth-p0, map-p0, marketing — prune (Phase 0)
Open PRs: (none)
```

## How to add a feature to this board

When you **start** building something:

1. Add under **IN FLIGHT** with `[~]`, branch name, worktree basename, one-line next step.
2. Add a matching Active row in `STATUS.md`.
3. Create `feat/<short-name>` (or `docs/…` for docs-only) **before** writing product code.
4. Prefer a **dedicated worktree** when another agent already has an active feature branch.
5. Prefer Phase 0 / 1 rows over Phase 2 unless the human reorders.

When you **finish**:

1. Move to SHIPPED as `[x]` (or delete from IN FLIGHT if folded into FEATURES only).
2. Update `FEATURES.md` in the same PR.
3. Clear Active row in `STATUS.md` after merge.
