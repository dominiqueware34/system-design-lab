# Status / Where Left Off

> Last updated: 2026-08-10 · Updated by: claim #10 freeze+reveal; #12 shipped; #25/#26 planning  
> Authority: Active work on **main**. Git worktree list is ground truth.

## TL;DR

Campaign seasons MVP UI shipped (#12 / PR #24). **Active:** #10 reduced — season freeze + post-season `reference_design` reveal only. Rate limits (#25) and next-season seed (#26) are **planning** labels. Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename | State |
| --- | --- | --- | --- |
| Season freeze + ref reveal (Artifact 7 reduced) | `feat/campaign-season-end` | (feature branch on main tree OK) | active · #10 |

## Next actions

1. Implement #10 (freeze + reveal) → PR → merge.
2. Leave #25 / #26 until product schedules them.
3. Close #12 if still open (code merged).
4. Prune STALE worktrees when convenient.
5. Do not start Plan B.

## Session handoff

- #10: effective season status from `ends_at` on read path; sync DB `live` → `ended` when expired; freeze start/submit; GET prompts may include `reference_design` only when ended.
- Do not implement rate limits or next-season seed on this branch.
