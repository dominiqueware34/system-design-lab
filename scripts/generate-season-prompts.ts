/**
 * Offline pipeline: generate 20 Campaign season prompts + reference designs.
 *
 * Usage:
 *   npm run generate:season-prompts           # requires XAI_API_KEY (live SpaceXAI)
 *   npm run generate:season-prompts -- --offline  # catalog-valid programmatic pack
 *
 * Output: fixtures/campaign/season-prompts-v1.json
 *
 * Does NOT insert into DB or touch season UI.
 */

import { generateObject } from "ai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { model } from "../src/lib/ai";
import {
  seasonPromptSchema,
  seasonPromptsFixtureSchema,
  type SeasonPrompt,
  type SeasonPromptsFixture,
} from "../src/lib/campaign-prompt-schema";
import { exportCatalogSchema } from "../src/lib/catalog-schema";
import { validateDesignGraph } from "../src/lib/design-graph-validate";
import { buildOfflineSeasonPrompts } from "../src/lib/season-prompts-offline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "fixtures/campaign/season-prompts-v1.json");

const TARGET_COUNT = 20;

function parseArgs(argv: string[]) {
  return {
    offline: argv.includes("--offline"),
    dryRun: argv.includes("--dry-run"),
  };
}

function validatePromptCatalog(prompt: SeasonPrompt, index: number): string[] {
  const errors: string[] = [];
  const parsed = seasonPromptSchema.safeParse(prompt);
  if (!parsed.success) {
    errors.push(
      `prompt[${index}] zod: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
    );
    return errors;
  }
  const graphResult = validateDesignGraph(
    prompt.referenceDesign as import("../src/lib/types").DesignGraph
  );
  if (!graphResult.ok) {
    for (const issue of graphResult.issues) {
      errors.push(
        `prompt[${index}] (${prompt.id}) ${issue.path}: [${issue.code}] ${issue.message}`
      );
    }
  }
  return errors;
}

function validateAll(prompts: SeasonPrompt[]): void {
  if (prompts.length !== TARGET_COUNT) {
    throw new Error(`Expected ${TARGET_COUNT} prompts, got ${prompts.length}`);
  }
  const ids = new Set<string>();
  const errors: string[] = [];
  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    if (ids.has(p.id)) {
      errors.push(`Duplicate id: ${p.id}`);
    }
    ids.add(p.id);
    errors.push(...validatePromptCatalog(p, i));
  }
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join("\n")}`);
  }
}

async function generateWithXai(): Promise<SeasonPrompt[]> {
  if (!process.env.XAI_API_KEY) {
    console.error(
      "Missing XAI_API_KEY. Add it to the environment (see .env.example).\n" +
        "For a catalog-valid pack without live AI, run:\n" +
        "  npm run generate:season-prompts -- --offline"
    );
    process.exit(1);
  }

  const catalog = exportCatalogSchema();
  const catalogSummary = {
    version: catalog.version,
    componentTypes: catalog.componentTypes,
    // Keep prompt size manageable: types + select enums only
    attributesByType: Object.fromEntries(
      catalog.components.map((c) => [
        c.type,
        c.attributes.map((a) => {
          if (a.type === "select") {
            return { key: a.key, type: a.type, options: a.options };
          }
          if (a.type === "number") {
            return {
              key: a.key,
              type: a.type,
              min: a.min,
              max: a.max,
              defaultValue: a.defaultValue,
            };
          }
          return { key: a.key, type: a.type, defaultValue: a.defaultValue };
        }),
      ])
    ),
  };

  // Generate in batches to reduce schema complexity / timeouts
  const batchSizes = [5, 5, 5, 5];
  const all: SeasonPrompt[] = [];
  let batchIndex = 0;

  for (const size of batchSizes) {
    batchIndex += 1;
    console.error(
      `Generating batch ${batchIndex}/${batchSizes.length} (${size} prompts) via SpaceXAI…`
    );

    const batchSchema = z.object({
      prompts: z.array(seasonPromptSchema).length(size),
    });

    const existingIds = all.map((p) => p.id);
    const { object } = await generateObject({
      model,
      schema: batchSchema,
      temperature: 0.5,
      system: `You author competitive Campaign season design-interview prompts for System Design Lab.

Rules:
- Each prompt is a full DesignProblem plus referenceDesign (DesignGraph) and rationale.
- referenceDesign nodes MUST use only catalog component types.
- Every node: id, type (= componentType), position {x,y}, data { componentType, label, category, color, icon, attributes }.
- attributes keys must match the catalog; select values must be from allowed options; numbers within min/max.
- Edges must reference existing node ids.
- Free-form DesignConstraints strings are fine (no Plan B engine).
- Tracks: classic (distributed systems) or agentic (LLM/agent/RAG/evals).
- Difficulty: easy | medium | hard.
- ids: unique kebab-case, prefer "season-..." prefix; must NOT collide with: ${existingIds.join(", ") || "(none yet)"}.
- Mix difficulties and tracks across the full set of 20 (aim ~12–14 classic, ~6–8 agentic).
- referenceDesign should be a plausible solid interview solution (not minimal toy).
- rationale: 1–3 sentences on why the reference works.`,
      prompt: `Generate ${size} NEW campaign season prompts (batch ${batchIndex}).

Catalog schema (types + attributes):
${JSON.stringify(catalogSummary, null, 2)}

Already generated ids (do not reuse): ${existingIds.join(", ") || "none"}

Return exactly ${size} prompts in the schema.`,
    });

    all.push(...object.prompts);
  }

  return all.slice(0, TARGET_COUNT);
}

function generateOffline(): SeasonPrompt[] {
  console.error("Generating programmatic offline season pack (no XAI)…");
  return buildOfflineSeasonPrompts();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.offline && !process.env.XAI_API_KEY) {
    console.error(
      "Missing XAI_API_KEY. Required for live generation.\n" +
        "Set XAI_API_KEY or pass --offline for a catalog-valid programmatic fixture.\n" +
        "See docs/specs/campaign-prompt-generation.md"
    );
    process.exit(1);
  }

  const source: SeasonPromptsFixture["source"] = args.offline
    ? "programmatic"
    : "xai";

  let prompts: SeasonPrompt[];
  try {
    prompts = args.offline ? generateOffline() : await generateWithXai();
  } catch (err) {
    console.error("Generation failed:", err);
    process.exit(1);
  }

  try {
    validateAll(prompts);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const fixture: SeasonPromptsFixture = {
    version: 1,
    formulaId: "v1_correct_diff_cover",
    source,
    generatedAt: new Date().toISOString(),
    notes:
      source === "programmatic"
        ? "Programmatic catalog-valid pack. Regenerate with XAI via npm run generate:season-prompts when XAI_API_KEY is set."
        : "Generated via SpaceXAI generateObject; validated against COMPONENT_CATALOG.",
    prompts,
  };

  const parsed = seasonPromptsFixtureSchema.safeParse(fixture);
  if (!parsed.success) {
    console.error("Fixture schema failed:", parsed.error.format());
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(JSON.stringify(fixture, null, 2));
    console.error(`Dry run OK: ${prompts.length} prompts, source=${source}`);
    return;
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  console.error(`Wrote ${OUT_PATH} (${prompts.length} prompts, source=${source})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
