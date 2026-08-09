# Brain maintenance

How humans and coding agents keep the application brain accurate.

## Triggers

| Event | PRODUCT | FEATURES | BOARD (on **main**) | STATUS (on **main**) | AGENTS.md / CLAUDE.md |
| --- | --- | --- | --- | --- | --- |
| New user-visible feature ships | rarely | **required** (same PR) | move row to SHIPPED / clear IN FLIGHT | clear Active row; refresh worktrees | only if entrypoints/env or anti-dup wrong |
| Start feature (multi-agent safe) | no | no | **add IN FLIGHT + parallel row on main first** | **add Active row on main first** | no |
| End of coding session (WIP) | no | no | update `next:` line | handoff notes (factual) | no |
| Merge PR | no | confirm row present | reconcile IN FLIGHT | drop Active rows for merged tips | no |
| STATUS/BOARD older than 7 days | no | no | **refresh from git before planning** | same | no |
| Positioning / primary mode change | **yes** | maybe | maybe | maybe | maybe Quick facts / anti-dup |
| Discover stale worktree | no | no | mark STALE in PARALLEL STATUS | mark STALE + action | no |
| Edit AGENTS product section | no | no | no | no | run Next.js smoke checklist |

## Multi-agent / feature-branch protocol

See `AGENTS.md` for the hard rules. Summary:

- One feature → one branch (`feat/...`); no product WIP on `main`
- Parallel agents → separate worktrees
- Claim on BOARD + STATUS on **main** before coding
- Never take over another agent’s IN FLIGHT branch without human OK

## STATUS authority (solo multi-worktree)

| Layer | Authority | Role |
| --- | --- | --- |
| `git worktree list` + tip vs `main` | **Primary** | What trees exist; CURRENT / STALE / AHEAD |
| `STATUS.md` on **`main`** | Intent SSOT | Active narrative, next actions, handoff |
| Feature-branch STATUS Active rows | **Avoid** | Ship FEATURES in the feature PR; keep Active on main |

### Updating Active work while on a feature branch

1. Prefer a tiny commit on `main` (or stash → checkout main → edit STATUS → commit → return).
2. Or a short-lived `chore/status` commit on main before long feature work.
3. After merge: drop Active rows for branches whose tips are ancestors of `main`.

### Conflict resolution

1. Union Active rows **by branch name** (one row per branch).
2. Drop rows whose tip is an ancestor of `main`.
3. TL;DR: prefer newer “Last updated”; if both fresh, one sentence each.
4. Worktrees table: regenerate from `git worktree list` (basenames only in the file).

## Definition of Done (feature PR)

A PR is incomplete if user-visible behavior changed and:

- [ ] `docs/brain/FEATURES.md` updated (or explicitly N/A for pure refactor)
- [ ] After merge, `docs/brain/STATUS.md` on main no longer lists the work as Active
- [ ] No secrets or “ignore FEATURES” instructions in brain files
- [ ] Next.js marker block in `AGENTS.md` untouched
- [ ] If a major new surface shipped, AGENTS “Do not reimplement” blurb still accurate (≤10 lines)

## Handoff note policy

**Allowed:** file paths, error messages, commands run, env **names** (not values), open questions.

**Forbidden:** API keys, tokens, passwords; imperative meta-instructions that contradict FEATURES or skip the read order.

Prefer tables over prose for Active work.

## Stale worktree playbook

```bash
# 1. Confirm tip is ancestor of main
git -C <worktree-path> rev-parse HEAD
git merge-base --is-ancestor <tip-sha> main && echo STALE

# 2. Remove worktree (local)
git worktree remove <worktree-path>
# or: git worktree remove --force <worktree-path>

# 3. Delete local branch if desired
git branch -d <branch>   # or -D if history already fully on main

# 4. Optional remote cleanup
git push origin --delete <branch>
```

STATUS Worktrees column uses **basenames only**. Absolute paths are local; re-run `git worktree list`.

Remote branches that are ancestors of `main` are **history**, not open workstreams.

## Next.js smoke checklist (`AGENTS.md`)

Product content must live **above** the managed block:

```html
<!-- BEGIN:nextjs-agent-rules -->
…
<!-- END:nextjs-agent-rules -->
```

After editing the product section:

1. Confirm product content is above `BEGIN:nextjs-agent-rules` and the managed block is intact.
2. Run `npm run dev` / `next dev` briefly if you want to exercise generator paths.
3. Re-open `AGENTS.md`: product section still above markers; block still says “This is NOT the Next.js you know.”
4. If the block was deleted, restore markers — never paste product rules inside them.

Generator reference: `node_modules/next/dist/server/lib/generate-agent-files.js` (upsert preserves content outside markers).

## Templates

### FEATURES row

```markdown
| Feature name | `/route` or API | `path/to/file.ts` | Short note |
```

Bump “Last verified” and HEAD sha when you verify inventory.

### STATUS Active row

| Field | Example |
| --- | --- |
| Workstream | Progress portfolio UI |
| Branch | `feat/portfolio-v1` |
| Worktree basename | `system-design-lab-portfolio` |
| Owner intent | List saved designs for signed-in users |
| State | `active` \| `blocked` \| `ready-to-merge` \| `stale` |

### STATUS caps

- **Next actions:** ≤10 items
- **Freshness:** Last updated ≤7 days (or ≤2 sessions) before trusting without git refresh

## Forbidden actions

- Putting product rules inside the Next.js marker block
- Long-lived per-worktree private brain files as SSOT
- Committing secrets or absolute `/Users/...` paths into STATUS
- Treating merged remote branches as open work without checking tip vs main
- Shipping user-visible features without a FEATURES update

## Optional automation (not required)

See design `docs/specs/application-brain.md` PR-2: `scripts/brain-status.sh` + `npm run brain:status` (report-only; never invent FEATURES rows).
