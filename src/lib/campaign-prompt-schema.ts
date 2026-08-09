/**
 * Zod schemas for competitive Campaign season prompts (Artifact 3).
 * Structural Zod + separate catalog validation via validateDesignGraph.
 */

import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const problemTrackSchema = z.enum(["classic", "agentic"]);

export const designConstraintsSchema = z
  .object({
    expectedQps: z.string().optional(),
    latencySla: z.string().optional(),
    availability: z.string().optional(),
    dataVolume: z.string().optional(),
    regions: z.string().optional(),
    readWriteRatio: z.string().optional(),
    consistency: z.string().optional(),
    budget: z.string().optional(),
    tokenBudget: z.string().optional(),
    maxSteps: z.string().optional(),
    other: z.array(z.string()).optional(),
  })
  .strict();

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const attributeValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const designNodeDataSchema = z
  .object({
    componentType: z.string().min(1),
    label: z.string().min(1),
    category: z.string().min(1),
    color: z.string().min(1),
    icon: z.string().min(1),
    attributes: z.record(z.string(), attributeValueSchema),
  })
  .passthrough();

export const serializedNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: positionSchema,
  data: designNodeDataSchema,
});

export const serializedEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
});

/** Structural DesignGraph — catalog rules applied by validateDesignGraph. */
export const designGraphSchema = z.object({
  nodes: z.array(serializedNodeSchema).min(1),
  edges: z.array(serializedEdgeSchema),
});

/** DesignProblem fields (matches src/lib/types DesignProblem). */
export const designProblemSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "id must be kebab-case (lowercase letters, digits, hyphens)"
    ),
  title: z.string().min(1),
  difficulty: difficultySchema,
  track: problemTrackSchema,
  summary: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string().min(1)).min(1),
  constraints: designConstraintsSchema,
  evaluationFocus: z.array(z.string().min(1)).min(1),
  hints: z.array(z.string()).optional(),
});

/**
 * One season campaign prompt: problem + hidden reference design + rationale.
 * References stay hidden until season end (product rule) — storage only here.
 */
export const seasonPromptSchema = designProblemSchema.extend({
  referenceDesign: designGraphSchema,
  rationale: z
    .string()
    .min(1)
    .describe("Why this reference satisfies the problem (teaching / reveal)"),
});

export const seasonPromptsFixtureSchema = z.object({
  version: z.literal(1),
  /** Scoring formula used when this pack is scored (season product). */
  formulaId: z.literal("v1_correct_diff_cover"),
  /** How the pack was produced. */
  source: z.enum(["xai", "programmatic"]),
  generatedAt: z.string().min(1),
  notes: z.string().optional(),
  prompts: z.array(seasonPromptSchema).length(20),
});

/** AI generateObject target: batch of prompts (script may call multiple times). */
export const seasonPromptBatchSchema = z.object({
  prompts: z.array(seasonPromptSchema).min(1).max(20),
});

export type SeasonPrompt = z.infer<typeof seasonPromptSchema>;
export type SeasonPromptsFixture = z.infer<typeof seasonPromptsFixtureSchema>;
export type DesignProblemParsed = z.infer<typeof designProblemSchema>;
