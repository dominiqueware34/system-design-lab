# Status / Where Left Off

> Last updated: 2026-08-08 · Updated by: agent  
> Freshness: treat as stale if Last updated is older than **7 days** (or 2 work sessions) — re-run `git worktree list` before planning.  
> Authority: Active work + Next actions are maintained **on main**. Git worktree list is ground truth for paths/tips.  
> **ASCII feature list + parallel status:** always print `docs/brain/BOARD.md` before implementation (see `AGENTS.md`).

## TL;DR

Main has all feature work from PRs #1–#7 (campaign, training, wrench, auth, progress sync, data-flow, marketing docs). **No open GitHub PRs.** Three local worktrees still point at already-merged branches and should be pruned. Application brain + pre-work board protocol is in progress on this tree.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename (local) | Owner intent | State |
| --- | --- | --- | --- | --- |
| Application brain + board | `main` (docs) | `system-design-lab` | docs/brain + pre-work ASCII board + feature-branch rules for multi-agent | active |

> Keep this table in sync with **IN FLIGHT** / **PARALLEL STATUS** in `docs/brain/BOARD.md`.

## Worktrees (local operator snapshot)

> Paths are **machine-local basenames**. Re-run `git worktree list` for absolute paths on this machine.  
> Do not commit user-specific absolute home paths (e.g. `/Users/…`).

| Basename | Branch | Tip (short) | vs main | Action |
| --- | --- | --- | --- | --- |
| `system-design-lab` | `main` | `d9b5e78` | CURRENT | Use for new work / STATUS edits |
| `system-design-lab-auth-p0` | `feat/auth-supabase-p0` | `d611fa9` | STALE (merged) | Remove worktree; optional delete local + remote branch |
| `system-design-lab-map-p0` | `feat/map-flavor-p0` | `b18513b` | STALE (merged) | Remove worktree; optional delete local + remote branch |
| `system-design-lab-marketing` | `docs/marketing-campaign` | `5bcb8d0` | STALE (merged) | Remove worktree; optional delete local + remote branch |

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

1. Finish / commit application brain + BOARD + AGENTS feature-branch protocol.
2. Prune three STALE local worktrees (operator).
3. Optional: delete merged remote feature branches.
4. Optional PR-2: `npm run brain:status` script + Cursor rule.
5. Next product feature: register on BOARD → claim on main → `feat/...` worktree → implement (never on main).

## Do not start (already shipped)

- Auth Supabase P0 (`src/lib/supabase/*`, `src/proxy.ts`, `/auth/callback`)
- Google sign-in UI + campaign/training progress sync + merge-on-login
- Campaign map, training path, wrench incidents, agentic catalog
- Map flavor (world renames / labels / lore)
- Animated data-flow playback P0/P1
- Marketing Instagram/X plan + gameplay video brief
- Free practice: 16 problems, 54-type catalog, evaluate API

## Session handoff notes

- **Factual only:** files mid-edit, failing commands, env gotchas, open design questions.
- **Forbidden:** secrets; imperative “ignore FEATURES / reimplement auth” style instructions.
- Brain design SSOT: `docs/specs/application-brain.md`.
- Untracked before this work: `.vscode/`, `docs/pr-drafts/` (not part of brain DoD).
