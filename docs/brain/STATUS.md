# Status / Where Left Off

> Last updated: 2026-08-10 · Updated by: validation-first roadmap + manual E2E plan  
> Authority: Active work on **main**. Git worktree list is ground truth.

## TL;DR

Campaign seasons MVP through freeze/ref-reveal API is on **main** (Artifacts 0–7 reduced).  
**No active coding workstream.** Roadmap is **validation-first**: live season + manual E2E + message sync before #25/#26 or Solo depth.  
Plan B parked. Queues/EF (#28) not planned.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename | State |
| --- | --- | --- | --- |
| *(none)* | — | — | — |

## Next actions (priority order)

### Phase 0 — this week (human)

1. **Seed a live Campaign season** (`npm run seed:season` or existing operator path). Confirm `/campaign` shows live window.
2. **Run manual E2E** — follow `docs/testing/manual-e2e-plan.md`. Log fails in the plan’s results table.
3. **Align marketing copy** to Training | Solo | Campaign seasons (not legacy map+wrench as primary).
4. **Prune STALE worktrees** when convenient (`auth-p0`, `map-p0`, `marketing`).
5. Optional: close GitHub #12 if still open (UI already merged PR #24).

### Phase 1 — after Phase 0 green

1. Soft free AI evaluate quota.
2. Minimal funnel metrics (hub → evaluate → Solo → Campaign submit).
3. One real 3-day season with external players + feedback notes.

### Phase 2 — only after retention signal

1. Solo content depth.
2. #26 next-season seed automation.
3. #25 rate limits / abuse protection.

### Always

- Do not start Plan B.
- Do not re-open Queues/Cron/EF unless product restarts #28-class work.
- Season-end DB status column: owner later (timestamp effective status is enough for MVP).

## Validation success signals (indie bar)

Use these to unlock Phase 2 product work:

| Signal | Target |
| --- | --- |
| Solo | ≥30% activated users finish ≥1 Solo problem |
| Campaign | ≥15% submit ≥1 season attempt in a live season |
| Pay intent | ≥5 people ask for Pro / would pay ~$12–15/mo |

## Session handoff

- Competitive freeze + ref reveal use **timestamps** (effective status) on main — no write-on-read.
- BOARD PLANNED order is **Phase 0 → 1 → 2**; #25/#26 are Phase 2, not “start here.”
- Manual E2E SSOT: `docs/testing/manual-e2e-plan.md`.
