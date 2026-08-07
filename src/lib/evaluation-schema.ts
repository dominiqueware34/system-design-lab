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
    reliability: z.object({
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
    evaluation: z.object({
      score: z.number().min(0).max(100),
      feedback: z
        .string()
        .describe(
          "How well they plan to measure quality: SLOs, span evals, e2e evals, traces"
        ),
    }),
  }),
  followUp: z
    .object({
      question: z
        .string()
        .describe("Socratic interviewer question about a gap, failure, scale, or evals"),
      failureScenario: z.string().describe("Concrete risk, load, or quality-measurement gap"),
      expectedFixHints: z
        .array(z.string())
        .describe("What a good remediation might include"),
      relatedComponentTypes: z
        .array(z.string())
        .describe("Catalog component type ids that could help"),
      kind: z
        .string()
        .describe("failure | scale | latency | evals | tool_loop | multi_agent | sharding | other"),
    })
    .nullable()
    .describe("Null if design is complete enough for this difficulty"),
  isComplete: z
    .boolean()
    .describe("True if no further follow-up is needed for this difficulty"),
});

export type EvaluationSchema = z.infer<typeof evaluationSchema>;
