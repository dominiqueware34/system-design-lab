# Application Brain

Agent-oriented source of truth for **System Design Lab**. Humans can read it too; coding agents should load it first.

## Read order

1. [PRODUCT.md](./PRODUCT.md) — what the product is and why
2. [FEATURES.md](./FEATURES.md) — what is shipped on `main` (do not reimplement)
3. [BOARD.md](./BOARD.md) — ASCII feature list + parallel branch status (**print before work**)
4. [STATUS.md](./STATUS.md) — handoff notes, next actions
5. [MAINTENANCE.md](./MAINTENANCE.md) — when/how to update these files

Entrypoints in repo root: `AGENTS.md`, `CLAUDE.md`.

## Rules of thumb

| Question | File |
| --- | --- |
| What is this product? | PRODUCT |
| Does feature X already exist? | FEATURES |
| What am I building / what’s in flight (ASCII)? | BOARD |
| Parallel branches / worktrees at a glance? | BOARD (+ `git worktree list`) |
| Handoff notes / next actions? | STATUS |
| Do I need to edit the brain after this PR? | MAINTENANCE |
| Multi-agent / feature branch rules? | AGENTS.md |

Deep design specs stay in `docs/specs/` — link from FEATURES, do not duplicate long prose here.

## Human QA

- Manual end-to-end checklist: [`docs/testing/manual-e2e-plan.md`](../testing/manual-e2e-plan.md)  
  Run after major merges or before a live season.
