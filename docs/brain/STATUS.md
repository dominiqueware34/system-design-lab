# Status / Where Left Off

> Last updated: 2026-08-09 · Updated by: issue-board execute (#16 + #15 claim)  
> Freshness: treat as stale if Last updated is older than **7 days** (or 2 work sessions) — re-run `git worktree list` before planning.  
> Authority: Active work + Next actions are maintained **on main**. Git worktree list is ground truth for paths/tips.  
> **ASCII feature list + parallel status:** always print `docs/brain/BOARD.md` before implementation (see `AGENTS.md`).

## TL;DR

Product concept: **system design teaching game** — Training → Practice → Solo Mode → Campaign seasons. Vocabulary SSOT: `docs/brain/PRODUCT.md` + `docs/specs/solo-vs-campaign.md` (Artifact 0 shipped via PR #18). **Active:** #16 nav shells + #15 prompt generation (parallel). Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename (local) | Owner intent | State |
| --- | --- | --- | --- | --- |
| App nav + route shells (Artifact 1) | `feat/app-nav-mode-shells` | `system-design-lab-nav-shell` | Nav + /solo /practice /campaign shells + hub | active · #16 |
| Campaign prompt gen (Artifact 3) | `feat/campaign-prompt-gen` | `system-design-lab-prompt-gen` | Catalog schema + 20 AI prompts fixture | active · #15 |

> Keep this table in sync with **IN FLIGHT** / **PARALLEL STATUS** in `docs/brain/BOARD.md`.

## Worktrees (local operator snapshot)

| Basename | Branch | Tip (short) | vs main | Action |
| --- | --- | --- | --- | --- |
| `system-design-lab` | `main` | `fb5f074` | CURRENT | Claims only |
| implementer (#16) | `feat/app-nav-mode-shells` | (create) | AHEAD expected | #16 |
| implementer (#15) | `feat/campaign-prompt-gen` | (create) | AHEAD expected | #15 |
| `system-design-lab-auth-p0` | `feat/auth-supabase-p0` | `d611fa9` | STALE | prune |
| `system-design-lab-map-p0` | `feat/map-flavor-p0` | `b18513b` | STALE | prune |
| `system-design-lab-marketing` | `docs/marketing-campaign` | `5bcb8d0` | STALE | prune |

## Next actions (ordered, ≤10)

1. Finish #16 nav shells → PR → merge.
2. Finish #15 prompt gen fixture → PR → merge (∥ #16).
3. Then #11 Solo multi-problem; #14 seasons DB (seed after #15).
4. Campaign chain #17 → #12 → #10.
5. Prune STALE worktrees; clear claims after merges.
6. Do not start Plan B.

## Do not start (already shipped)

- Artifact 0 vocabulary (PR #18)
- Auth, campaign map (legacy), training, evaluate, data-flow, marketing docs, brain protocol

## Session handoff notes

- **Parallel:** #16 and #15 must not share DesignWorkspace/hot product files (#15 is lib/scripts/fixtures only).
- **Scoring SSOT:** `docs/specs/solo-vs-campaign.md` (`v1_correct_diff_cover`).
- **Plan B parked.**
