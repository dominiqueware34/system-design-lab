/**
 * Seed a draft Campaign season from fixtures/campaign/season-prompts-v1.json.
 *
 * Artifact 4 (#14) — does not start a live season or touch Solo tables.
 *
 * Usage:
 *   npm run seed:season                 # upsert draft season + 20 prompts
 *   npm run seed:season -- --dry-run    # validate fixture + print plan (no DB)
 *   npm run seed:season -- --slug my-slug --title "My Season"
 *
 * Requires (for non-dry-run):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   # server-only; never NEXT_PUBLIC_
 *
 * Apply migrations first (see SUMMARY.md / docs/setup-auth.md).
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  seasonPromptsFixtureSchema,
  type SeasonPrompt,
  type SeasonPromptsFixture,
} from "../src/lib/campaign-prompt-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURE_PATH = path.join(ROOT, "fixtures/campaign/season-prompts-v1.json");

const DEFAULT_SLUG = "season-v1-draft";
const DEFAULT_TITLE = "Season v1 (draft seed)";

/** Client-safe problem payload — never includes referenceDesign / rationale. */
function problemFromPrompt(prompt: SeasonPrompt) {
  return {
    id: prompt.id,
    title: prompt.title,
    difficulty: prompt.difficulty,
    track: prompt.track,
    summary: prompt.summary,
    description: prompt.description,
    requirements: prompt.requirements,
    constraints: prompt.constraints,
    evaluationFocus: prompt.evaluationFocus,
    ...(prompt.hints ? { hints: prompt.hints } : {}),
  };
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  let slug = DEFAULT_SLUG;
  let title = DEFAULT_TITLE;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--slug" && argv[i + 1]) {
      slug = argv[++i];
    } else if (argv[i] === "--title" && argv[i + 1]) {
      title = argv[++i];
    }
  }
  return { dryRun, slug, title };
}

async function loadFixture(): Promise<SeasonPromptsFixture> {
  const raw = await readFile(FIXTURE_PATH, "utf8");
  const json = JSON.parse(raw) as unknown;
  const parsed = seasonPromptsFixtureSchema.safeParse(json);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid season fixture at ${FIXTURE_PATH}:\n${detail}`);
  }
  return parsed.data;
}

function defaultRules(formulaId: string) {
  return {
    score_formula: formulaId,
    max_attempts: 3,
  };
}

async function main() {
  const { dryRun, slug, title } = parseArgs(process.argv.slice(2));
  const fixture = await loadFixture();
  const rules = defaultRules(fixture.formulaId);

  console.log("Fixture:", FIXTURE_PATH);
  console.log("  version:", fixture.version);
  console.log("  formulaId:", fixture.formulaId);
  console.log("  source:", fixture.source);
  console.log("  prompts:", fixture.prompts.length);
  console.log("Season plan:");
  console.log("  slug:", slug);
  console.log("  title:", title);
  console.log("  status: draft");
  console.log("  rules:", JSON.stringify(rules));

  if (dryRun) {
    console.log("\n--dry-run: no database writes.");
    console.log(
      "Sample prompt_keys:",
      fixture.prompts.slice(0, 3).map((p) => p.id).join(", "),
      "…"
    );
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url.includes("your-project-ref")) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (real project). See .env.example."
    );
    process.exit(1);
  }
  if (!serviceKey) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server-only).\n" +
        "Seed must use service role so draft seasons and reference_design can be written.\n" +
        "Never put this key in NEXT_PUBLIC_*."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Upsert season by slug (draft only — never auto-promote to live).
  const { data: existing, error: findErr } = await supabase
    .from("campaign_seasons")
    .select("id, status, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (findErr) {
    console.error("Failed to look up season:", findErr.message);
    process.exit(1);
  }

  let seasonId: string;

  if (existing?.id) {
    if (existing.status === "live") {
      console.error(
        `Refusing to reseed season slug="${slug}" while status=live. ` +
          "Use a new --slug or end the season first."
      );
      process.exit(1);
    }
    const { data: updated, error: updErr } = await supabase
      .from("campaign_seasons")
      .update({
        title,
        status: "draft",
        rules,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (updErr || !updated) {
      console.error("Failed to update season:", updErr?.message);
      process.exit(1);
    }
    seasonId = updated.id;
    console.log("Updated draft season:", seasonId);

    // Replace prompts for this season (full reseed of fixture pack).
    const { error: delErr } = await supabase
      .from("campaign_prompts")
      .delete()
      .eq("season_id", seasonId);
    if (delErr) {
      console.error("Failed to clear existing prompts:", delErr.message);
      process.exit(1);
    }
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("campaign_seasons")
      .insert({
        slug,
        title,
        status: "draft",
        rules,
        starts_at: null,
        ends_at: null,
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      console.error("Failed to insert season:", insErr?.message);
      process.exit(1);
    }
    seasonId = inserted.id;
    console.log("Created draft season:", seasonId);
  }

  const rows = fixture.prompts.map((prompt, index) => ({
    season_id: seasonId,
    prompt_key: prompt.id,
    problem: problemFromPrompt(prompt),
    reference_design: prompt.referenceDesign,
    rationale: prompt.rationale,
    difficulty: prompt.difficulty,
    track: prompt.track,
    sort_order: index + 1,
  }));

  // Batch insert (20 rows is fine in one call).
  const { data: promptRows, error: promptErr } = await supabase
    .from("campaign_prompts")
    .insert(rows)
    .select("id, prompt_key, sort_order");

  if (promptErr) {
    console.error("Failed to insert prompts:", promptErr.message);
    process.exit(1);
  }

  console.log(
    `Seeded ${promptRows?.length ?? 0} prompts into draft season slug="${slug}".`
  );
  console.log(
    "Note: status=draft → not visible to authenticated clients (RLS). " +
      "Promote to live only when ready (operator / later artifact)."
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
