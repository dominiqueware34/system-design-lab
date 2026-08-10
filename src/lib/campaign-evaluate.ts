/**
 * Server-side design evaluation for Campaign submit (Artifact 5).
 * Scores are never trusted from the client.
 */

import { generateObject } from "ai";
import { EVALUATION_SYSTEM_PROMPT, model } from "@/lib/ai";
import { evaluationSchema } from "@/lib/evaluation-schema";
import type { DesignGraph, DesignProblem } from "@/lib/types";

function buildUserPrompt(problem: DesignProblem, design: DesignGraph): string {
  const parts: string[] = [
    "## Problem",
    `Title: ${problem.title}`,
    `Track: ${problem.track} (${problem.track === "agentic" ? "agentic AI workflow" : "classic distributed systems"})`,
    `Difficulty: ${problem.difficulty}`,
    `Summary: ${problem.summary}`,
    `Description: ${problem.description}`,
    `Requirements:\n${(problem.requirements ?? []).map((r) => `- ${r}`).join("\n")}`,
    `Constraints:\n${JSON.stringify(problem.constraints ?? {}, null, 2)}`,
    `Evaluation focus: ${(problem.evaluationFocus ?? []).join(", ")}`,
    "",
    "## Candidate design (JSON)",
    JSON.stringify(design, null, 2),
  ];

  if (problem.track === "agentic") {
    parts.push(
      "",
      "## Agentic interview notes",
      "Check for: model selection, tools (RAG/web/code), multi-step tool→LLM loops (edges), multi-agent parallelization if needed, and span/e2e evals or traces."
    );
  } else {
    parts.push(
      "",
      "## Classic interview notes",
      "Check for: sharding/partition keys, hashing strategies, global/multi-region scale, caching, and failure domains."
    );
  }

  parts.push(
    "",
    "Evaluate this design and return structured scores for all five dimensions (including evaluation)."
  );

  return parts.join("\n");
}

/**
 * Run SpaceXAI evaluate on a campaign design.
 * Returns overall score 0–100 plus summary fields for the attempt response.
 */
export async function evaluateCampaignDesign(
  problem: DesignProblem,
  design: DesignGraph
): Promise<{
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  isComplete: boolean;
}> {
  if (!process.env.XAI_API_KEY) {
    throw new Error(
      "Missing XAI_API_KEY. Add it to .env.local (see .env.example)."
    );
  }

  const { object } = await generateObject({
    model,
    schema: evaluationSchema,
    system: EVALUATION_SYSTEM_PROMPT,
    prompt: buildUserPrompt(problem, design),
    temperature: 0.4,
  });

  return {
    score: object.score,
    summary: object.summary,
    strengths: object.strengths,
    gaps: object.gaps,
    isComplete: object.isComplete,
  };
}

/** Coerce problem JSONB into DesignProblem-shaped object for evaluate. */
export function problemFromJson(raw: unknown): DesignProblem | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.title !== "string") return null;
  return {
    id: p.id,
    title: p.title,
    difficulty: (p.difficulty as DesignProblem["difficulty"]) ?? "medium",
    track: (p.track as DesignProblem["track"]) ?? "classic",
    summary: typeof p.summary === "string" ? p.summary : "",
    description: typeof p.description === "string" ? p.description : "",
    requirements: Array.isArray(p.requirements)
      ? p.requirements.filter((x): x is string => typeof x === "string")
      : [],
    constraints:
      p.constraints && typeof p.constraints === "object"
        ? (p.constraints as DesignProblem["constraints"])
        : {},
    evaluationFocus: Array.isArray(p.evaluationFocus)
      ? p.evaluationFocus.filter((x): x is string => typeof x === "string")
      : [],
    ...(Array.isArray(p.hints)
      ? { hints: p.hints.filter((x): x is string => typeof x === "string") }
      : {}),
  };
}
