# Status / Where Left Off

> Last updated: 2026-08-10 · Updated by: issue-board execute (#17 claim; clear #11/#14)  
> Authority: Active work on **main**. Git worktree list is ground truth.

## TL;DR

Artifacts 0–4 + Solo multi-problem (#11) shipped. **Active:** #17 Campaign submit API + scoring. Next after merge: #12 UI, then #10 harden. Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename | State |
| --- | --- | --- | --- |
| Campaign submit API + scoring (Artifact 5) | `feat/campaign-submit-api` | `system-design-lab-submit-api` | active · #17 |

## Next actions

1. Implement #17 → PR → merge.
2. Then #12 season UI + leaderboard.
3. Then #10 hardening.
4. Prune STALE worktrees (auth-p0, map-p0, marketing).
5. Do not start Plan B.

## Session handoff

- #17 owns `src/lib/campaign-scoring.ts` + `/api/campaign/*` (seasons current/prompts/start/submit/leaderboard/me).
- Server-authoritative score; max 3 attempts; sticky `started_at`; LB has no durations.
- Do not build Campaign season UI (#12) or Solo paths on this branch.
- Do not mix solo and campaign score tables.
