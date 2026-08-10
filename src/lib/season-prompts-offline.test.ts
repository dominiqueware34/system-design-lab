import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seasonPromptsFixtureSchema } from "@/lib/campaign-prompt-schema";
import { validateDesignGraph } from "@/lib/design-graph-validate";
import { buildOfflineSeasonPrompts } from "@/lib/season-prompts-offline";
import type { DesignGraph } from "@/lib/types";

describe("offline season prompts pack", () => {
  it("builds exactly 20 catalog-valid prompts", () => {
    const prompts = buildOfflineSeasonPrompts();
    assert.equal(prompts.length, 20);

    const ids = new Set(prompts.map((p) => p.id));
    assert.equal(ids.size, 20, "ids must be unique");

    for (const p of prompts) {
      const result = validateDesignGraph(p.referenceDesign as DesignGraph);
      assert.equal(
        result.ok,
        true,
        `${p.id}: ${JSON.stringify(result.issues, null, 2)}`
      );
    }

    const fixture = {
      version: 1 as const,
      formulaId: "v1_correct_diff_cover" as const,
      source: "programmatic" as const,
      generatedAt: new Date().toISOString(),
      prompts,
    };
    const parsed = seasonPromptsFixtureSchema.safeParse(fixture);
    assert.equal(
      parsed.success,
      true,
      parsed.success ? "" : JSON.stringify(parsed.error.format(), null, 2)
    );
  });
});
