# Artifact 3 — Campaign prompt gen (#15)

## PR

(see below after open)

## What shipped

Offline pipeline + committed fixture for competitive Campaign seasons:

- `exportCatalogSchema()` from `COMPONENT_CATALOG`
- Zod schemas for season prompts (problem + referenceDesign + rationale + difficulty + track)
- `validateDesignGraph` (unknown types / bad enums fail)
- Script `scripts/generate-season-prompts.ts` → `fixtures/campaign/season-prompts-v1.json`
- **20** catalog-valid prompts in fixture (programmatic source; XAI path when key present)
- Operator docs: `docs/specs/campaign-prompt-generation.md`

## How to test

```bash
npm install
npm test
npm run generate:season-prompts -- --offline   # rewrite fixture without API
# with key:
# export XAI_API_KEY=...
# npm run generate:season-prompts              # fails without key unless --offline
```

## Out of scope (intentional)

- Season UI / nav / DesignWorkspace
- DB insert / migrations
- Plan B constraint engine
- Live mid-request generation

## Risks

- Committed fixture is `source: programmatic` (not live XAI). Regenerate with `XAI_API_KEY` when desired; re-validate with `npm test` + script.
- AI batches may occasionally emit invalid catalog enums; script validates and exits non-zero — re-run or fall back to `--offline`.
