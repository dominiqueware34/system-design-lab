# Status / Where Left Off

> Last updated: 2026-08-09 · Updated by: issue-board execute (#13 claim)  
> Freshness: treat as stale if Last updated is older than **7 days** (or 2 work sessions) — re-run `git worktree list` before planning.  
> Authority: Active work + Next actions are maintained **on main**. Git worktree list is ground truth for paths/tips.  
> **ASCII feature list + parallel status:** always print `docs/brain/BOARD.md` before implementation (see `AGENTS.md`).

## TL;DR

Product concept: **system design teaching game** — learn (training/practice), then play Solo and compete in **Campaign** seasons (roadmap issues #10–#17). Brain protocol shipped (PR #8/#9). **Active:** Artifact 0 docs vocabulary (`docs/solo-campaign-modes`, #13). Three local worktrees still STALE (prune when convenient).

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename (local) | Owner intent | State |
| --- | --- | --- | --- | --- |
| Solo vs Campaign vocabulary (Artifact 0) | `docs/solo-campaign-modes` | `system-design-lab-docs-solo-campaign` | PRODUCT + spec + BOARD 0–7 + AGENTS; docs PR | active · issue #13 |

> Keep this table in sync with **IN FLIGHT** / **PARALLEL STATUS** in `docs/brain/BOARD.md`.

## Worktrees (local operator snapshot)

> Paths are **machine-local basenames**. Re-run `git worktree list` for absolute paths on this machine.  
> Do not commit user-specific absolute home paths (e.g. `/Users/…`).

| Basename | Branch | Tip (short) | vs main | Action |
| --- | --- | --- | --- | --- |
| `system-design-lab` | `main` | `ce98b6f` | CURRENT | Claims / STATUS only |
| `system-design-lab-docs-solo-campaign` | `docs/solo-campaign-modes` | (create on implement) | AHEAD expected | #13 implementer |
| `system-design-lab-auth-p0` | `feat/auth-supabase-p0` | `d611fa9` | STALE (merged) | Remove worktree |
| `system-design-lab-map-p0` | `feat/map-flavor-p0` | `b18513b` | STALE (merged) | Remove worktree |
| `system-design-lab-marketing` | `docs/marketing-campaign` | `5bcb8d0` | STALE (merged) | Remove worktree |

### Tip classification

1. `tip == main` → **CURRENT**
2. tip is ancestor of `main` and not equal → **STALE**
3. else → **AHEAD / DIVERGED**

## Remote branches (merged history — not open work)

These may still exist on `origin` after local worktrees are removed. They are **not** active feature work unless the tip is **not** an ancestor of `main`:

- `origin/feat/auth-supabase-p0`
- `origin/feat/map-flavor-p0`
- `origin/docs/marketing-campaign`
- `origin/feat/auth-google-progress-sync`
- `origin/feat/animated-data-flow`
- `origin/feat/campaign-training-wrench`

Optional: `git push origin --delete <branch>` when cleaning up.

## Next actions (ordered, ≤10)

1. Finish #13: Solo vs Campaign docs on `docs/solo-campaign-modes` → open docs PR → merge.
2. Then #16 nav shells and/or #15 prompt gen (∥ after #13).
3. Prune three STALE local worktrees (operator).
4. Optional: delete merged remote feature branches.
5. Do not start Plan B (constraint engine) — parked.

## Do not start (already shipped)

- Auth Supabase P0 (`src/lib/supabase/*`, `src/proxy.ts`, `/auth/callback`)
- Google sign-in UI + campaign/training progress sync + merge-on-login
- Campaign map, training path, wrench incidents, agentic catalog
- Map flavor (world renames / labels / lore)
- Animated data-flow playback P0/P1
- Marketing Instagram/X plan + gameplay video brief
- Free practice: 16 problems, 54-type catalog, evaluate API
- Application brain protocol (PR #8/#9)

## Session handoff notes

- **Factual only:** files mid-edit, failing commands, env gotchas, open design questions.
- **Forbidden:** secrets; imperative “ignore FEATURES / reimplement auth” style instructions.
- Brain design SSOT: `docs/specs/application-brain.md`.
- Program roadmap: GitHub issues #10–#17 (Artifacts 0–7). Plan B parked.
