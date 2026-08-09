# Status / Where Left Off

> Last updated: 2026-08-09 · Updated by: Artifact 0 implementer (#13 docs/solo-campaign-modes)  
> Freshness: treat as stale if Last updated is older than **7 days** (or 2 work sessions) — re-run `git worktree list` before planning.  
> Authority: Active work + Next actions are maintained **on main**. Git worktree list is ground truth for paths/tips.  
> **ASCII feature list + parallel status:** always print `docs/brain/BOARD.md` before implementation (see `AGENTS.md`).

## TL;DR

Product concept: **system design teaching game** — **Training** → **Practice** → **Solo Mode** (personal levels) → **Campaign** (3-day seasons + leaderboard). Vocabulary SSOT: `docs/brain/PRODUCT.md` + `docs/specs/solo-vs-campaign.md`. Brain protocol shipped (PR #8/#9). **Active:** Artifact 0 docs (#13) on `docs/solo-campaign-modes`. Competitive seasons and Solo Mode are **not** shipped (see FEATURES for legacy campaign map). Plan B parked.

## Active work (in flight) — committed on main

| Workstream | Branch | Worktree basename (local) | Owner intent | State |
| --- | --- | --- | --- | --- |
| Solo vs Campaign vocabulary (Artifact 0) | `docs/solo-campaign-modes` | implementer / subagent worktree | PRODUCT + `solo-vs-campaign.md` + BOARD 0–7 + AGENTS; **docs PR** | active · issue #13 · keep until merge |

> Keep this table in sync with **IN FLIGHT** / **PARALLEL STATUS** in `docs/brain/BOARD.md`.

## Worktrees (local operator snapshot)

> Paths are **machine-local basenames**. Re-run `git worktree list` for absolute paths on this machine.  
> Do not commit user-specific absolute home paths (e.g. `/Users/…`).

| Basename | Branch | Tip (short) | vs main | Action |
| --- | --- | --- | --- | --- |
| `system-design-lab` (or primary) | `main` | `2d34cdb` | CURRENT | Claims / STATUS only after merge |
| implementer worktree | `docs/solo-campaign-modes` | (PR tip) | AHEAD | #13 docs — merge then clear Active |
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

1. Merge Artifact 0 docs PR **#18** (issue #13) → on main: clear Active / move BOARD row for #13 to done (docs); keep Artifacts 1–7 planned.
2. Start **#16** nav shells and/or **#15** prompt gen (parallel after #13).
3. Then Solo **#11**; Campaign chain **#14 → #17 → #12 → #10** (seed after #15).
4. Prune three STALE local worktrees (operator).
5. Optional: delete merged remote feature branches.
6. Do not start Plan B (constraint engine) — parked.
7. Do not claim Solo Mode or Campaign seasons in FEATURES until runtime ships.

## Session handoff notes (Artifact 0)

- **Docs-only:** no code, migrations, or UI.
- **New SSOT:** `docs/specs/solo-vs-campaign.md` — locked decisions + scoring `v1_correct_diff_cover`.
- **PRODUCT.md** rewritten modes: Training | Practice | Solo Mode | Campaign; legacy map called out as pre mode-split.
- **AGENTS.md** quick facts: two play modes; seasons not shipped until FEATURES.
- **Scoring lock:** `prompt_points = ai_score × diff_mult` (easy 1.0 / med 1.35 / hard 1.75); `season_score = sum(prompt_points) × (0.55 + 0.45×N/20)`; **time not in points**.
- **Legacy collision:** shipped `/campaign` map + wrenches ≠ competitive season product; agents must read this STATUS + PRODUCT.

## Do not start (already shipped)

- Auth Supabase P0 (`src/lib/supabase/*`, `src/proxy.ts`, `/auth/callback`)
- Google sign-in UI + campaign/training progress sync + merge-on-login
- Campaign map, training path, wrench incidents, agentic catalog
- Map flavor (world renames / labels / lore)
- Animated data-flow playback P0/P1
- Marketing Instagram/X plan + gameplay video brief
- Free practice: 16 problems, 54-type catalog, evaluate API
- Application brain protocol (PR #8/#9)

## Session handoff notes (general)

- **Factual only:** files mid-edit, failing commands, env gotchas, open design questions.
- **Forbidden:** secrets; imperative “ignore FEATURES / reimplement auth” style instructions.
- Brain design SSOT: `docs/specs/application-brain.md`.
- Mode split SSOT: `docs/specs/solo-vs-campaign.md`.
- Program roadmap: GitHub issues #10–#17 (Artifacts 0–7). Plan B parked.
