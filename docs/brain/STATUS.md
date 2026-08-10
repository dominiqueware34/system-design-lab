# Status / Where Left Off

> Last updated: 2026-08-10 · Updated by: clear #10; cancel queues #28 / PR #29  
> Authority: Active work on **main**. Git worktree list is ground truth.

## TL;DR

Campaign seasons MVP through freeze/ref-reveal API is on **main** (Artifacts 0–7 reduced). **No active workstream.** Queues / background-jobs track cancelled (#28 not_planned; PR #29 closed). Season DB status expire deferred to owner later. #25/#26 still planning. Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename | State |
| --- | --- | --- | --- |
| *(none)* | — | — | — |

## Next actions

1. Optional: close #12 if still open (UI already merged PR #24).
2. Leave #25 / #26 until product schedules them.
3. Season-end DB persistence: owner later — not Queues/EF board item.
4. Prune STALE worktrees when convenient.
5. Do not start Plan B.

## Session handoff

- Competitive freeze + ref reveal use **timestamps** (effective status) on main — no write-on-read.
- Do not re-open Queues/Cron/EF work unless product restarts #28-class work.
