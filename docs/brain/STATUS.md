# Status / Where Left Off

> Last updated: 2026-08-09 · Updated by: issue-board execute (#11 + #14 claim)  
> Authority: Active work on **main**. Git worktree list is ground truth.

## TL;DR

Vocabulary + nav shells + season prompt fixture shipped (#13/#16/#15). **Active:** #11 Solo multi-problem + #14 Campaign seasons DB (parallel). Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename | State |
| --- | --- | --- | --- |
| Solo multi-problem (Artifact 2) | `feat/solo-multi-problem` | `system-design-lab-solo` | active · #11 |
| Campaign seasons DB (Artifact 4) | `feat/campaign-seasons-db` | `system-design-lab-seasons-db` | active · #14 |

## Next actions

1. Finish #11 + #14 → PRs → merge.
2. Then #17 submit API (needs #14 + #15).
3. Then #12 UI, #10 harden.
4. Clear claims after merges; prune STALE worktrees.
5. Do not start Plan B.

## Session handoff

- #11 owns solo_progress / Solo UI / DesignWorkspace solo path.
- #14 owns campaign_* + profiles migrations only — seed from fixtures/campaign/season-prompts-v1.json.
- Do not mix solo and campaign score tables.
