# Campaign prompt generation (Artifact 3)

> Offline pipeline only. **No live mid-request generation.**  
> Issue **#15** · Branch `feat/campaign-prompt-gen`  
> Product rules: `docs/specs/solo-vs-campaign.md` (20 prompts / season, scoring `v1_correct_diff_cover`).

## What this produces

| Output | Path |
| --- | --- |
| Season prompt pack (v1) | `fixtures/campaign/season-prompts-v1.json` |

Each of the **20** entries includes:

- Full **DesignProblem** fields (`id`, `title`, `difficulty`, `track`, `summary`, `description`, `requirements`, `constraints`, `evaluationFocus`, optional `hints`)
- **`referenceDesign`** — a `DesignGraph` (nodes + edges) using only catalog component types / attribute enums
- **`rationale`** — why the reference satisfies the problem (reveal after season end; storage only in this artifact)

Fixture metadata:

- `version: 1`
- `formulaId: "v1_correct_diff_cover"`
- `source: "xai" | "programmatic"`
- `generatedAt` ISO timestamp

## Libraries

| Module | Role |
| --- | --- |
| `src/lib/catalog-schema.ts` | `exportCatalogSchema()` — types + attributes JSON from `COMPONENT_CATALOG` |
| `src/lib/design-graph-validate.ts` | `validateDesignGraph()` — unknown types / bad enums / ranges / edges fail |
| `src/lib/campaign-prompt-schema.ts` | Zod: problem + graph + rationale + fixture wrapper |
| `src/lib/design-graph-builder.ts` | Helpers to build valid nodes from catalog defaults |
| `src/lib/season-prompts-offline.ts` | Programmatic 20-prompt pack (fallback / committed default) |

## Operator steps

### Prerequisites

```bash
npm install
# optional for live AI:
export XAI_API_KEY=...   # or put in .env.local and load it
```

### Run unit tests (validator + catalog export)

```bash
npm test
```

### Generate / regenerate the fixture

**Live SpaceXAI** (preferred when key is available):

```bash
export XAI_API_KEY=sk-...
npm run generate:season-prompts
```

Requires `XAI_API_KEY`. Uses `generateObject` + catalog schema in the prompt, then runs Zod + `validateDesignGraph` on every reference. Writes `fixtures/campaign/season-prompts-v1.json`.

**Offline programmatic** (no key; still catalog-validated):

```bash
npm run generate:season-prompts -- --offline
```

**Dry-run** (print JSON, no write):

```bash
npm run generate:season-prompts -- --offline --dry-run
```

### Commit

Commit the fixture on the feature branch after generation. Do **not** commit secrets.

## Constraints (v1)

- Free-form / existing `DesignConstraints` string fields only.
- **Plan B** (attribute→QPS constraint engine) is **parked** — not used here.
- No season UI, no DB insert (Artifacts 4–5 import this fixture later).
- No changes to evaluate API runtime behavior.

## Acceptance checklist

- [x] 20 valid prompts in fixture
- [x] Invalid component type fails unit test
- [x] Script requires `XAI_API_KEY` unless `--offline`
