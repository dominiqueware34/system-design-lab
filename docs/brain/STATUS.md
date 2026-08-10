# Status / Where Left Off

> Last updated: 2026-08-10 · Updated by: issue-board execute (#12 claim; clear #17)  
> Authority: Active work on **main**. Git worktree list is ground truth.

## TL;DR

Artifact 5 submit API shipped (#17 / PR #23). **Active:** #12 Campaign season UI + leaderboard. Then #10 harden. Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename | State |
| --- | --- | --- | --- |
| Campaign season UI + leaderboard (Artifact 6) | `feat/campaign-season-ui` | `system-design-lab-season-ui` | active · #12 |

## Next actions

1. Implement #12 → PR → merge.
2. Then #10 Campaign hardening.
3. Prune STALE worktrees (auth-p0, map-p0, marketing).
4. Do not start Plan B.

## Session handoff

- #12 owns `/campaign` hub, `/campaign/play/[promptId]`, `/campaign/leaderboard`, my stats, DesignWorkspace `mode: "campaign"`.
- Wire play submit only to `/api/campaign/submit` (Artifact 5 APIs already on main).
- Auth required for play routes; no wrenches; LB has no time column.
- Do not rework campaign scoring formula or Solo multi-problem on this branch.
