import { z } from "zod";

export const wrenchSchema = z.object({
  id: z.string().describe("Short slug id for this wrench"),
  title: z.string().describe("Short title e.g. 'Primary DB Meltdown'"),
  headline: z
    .string()
    .describe("One-line banner text like a game event popup"),
  category: z.enum([
    "latency",
    "security",
    "capacity",
    "failure",
    "cost",
    "data",
    "evals",
    "agent",
  ]),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  narrative: z
    .string()
    .describe("2-4 sentences: what just happened in production"),
  impact: z
    .string()
    .describe("Concrete symptoms: error rates, latency, queue depth, etc."),
  whyThisDesign: z
    .string()
    .describe("How THIS candidate's graph made them vulnerable"),
  challengeQuestion: z
    .string()
    .describe("What the player must fix on the canvas"),
  expectedFixHints: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Hints only — not the full solution"),
  relatedComponentTypes: z
    .array(z.string())
    .describe("Catalog type ids that could help e.g. cache, load_balancer"),
});

export type WrenchSchema = z.infer<typeof wrenchSchema>;

export const wrenchEvalSchema = z.object({
  addressed: z
    .boolean()
    .describe("Whether the new design specifically mitigates the wrench"),
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  remainingGaps: z.array(z.string()),
  /** If not addressed and more chaos is allowed, optional second hit */
  passLevel: z
    .boolean()
    .describe("True if player may clear the level (wrench fixed + design solid enough)"),
  feedback: z.string().describe("Direct coach feedback on the fix"),
});

export type WrenchEvalSchema = z.infer<typeof wrenchEvalSchema>;
