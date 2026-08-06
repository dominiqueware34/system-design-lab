import { z } from "zod";

export const evaluationSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall score 0-100"),
  summary: z.string().describe("2-4 sentence overall assessment"),
  strengths: z.array(z.string()).describe("What the candidate did well"),
  gaps: z.array(z.string()).describe("Important missing pieces or risks"),
  dimensions: z.object({
    latency: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
    redundancy: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
    scale: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
    correctness: z.object({
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
  }),
  followUp: z
    .object({
      question: z
        .string()
        .describe("Socratic interviewer question about a gap or failure mode"),
      failureScenario: z.string().describe("Concrete failure or load scenario"),
      expectedFixHints: z
        .array(z.string())
        .describe("What a good remediation might include"),
      relatedComponentTypes: z
        .array(z.string())
        .describe("Catalog component type ids that could help"),
    })
    .nullable()
    .describe("Null if design is complete enough for this difficulty"),
  isComplete: z
    .boolean()
    .describe("True if no further follow-up is needed for this difficulty"),
});

export type EvaluationSchema = z.infer<typeof evaluationSchema>;
