import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { EVALUATION_SYSTEM_PROMPT, model } from "@/lib/ai";
import { evaluationSchema } from "@/lib/evaluation-schema";
import type { DesignGraph, DesignProblem, FollowUpChallenge } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface EvaluateBody {
  problem: DesignProblem;
  design: DesignGraph;
  priorFollowUp?: FollowUpChallenge | null;
  history?: Array<{ role: string; content: string }>;
}

export async function POST(req: Request) {
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Missing XAI_API_KEY. Add it to .env.local (see .env.example). Get a key at https://console.x.ai",
      },
      { status: 500 }
    );
  }

  let body: EvaluateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { problem, design, priorFollowUp, history } = body;

  if (!problem?.id || !design) {
    return NextResponse.json(
      { error: "problem and design are required" },
      { status: 400 }
    );
  }

  const userPrompt = buildUserPrompt(problem, design, priorFollowUp, history);

  try {
    const { object } = await generateObject({
      model,
      schema: evaluationSchema,
      system: EVALUATION_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Evaluation failed:", err);
    const message = err instanceof Error ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildUserPrompt(
  problem: DesignProblem,
  design: DesignGraph,
  priorFollowUp?: FollowUpChallenge | null,
  history?: Array<{ role: string; content: string }>
): string {
  const parts: string[] = [
    "## Problem",
    `Title: ${problem.title}`,
    `Difficulty: ${problem.difficulty}`,
    `Summary: ${problem.summary}`,
    `Description: ${problem.description}`,
    `Requirements:\n${problem.requirements.map((r) => `- ${r}`).join("\n")}`,
    `Constraints:\n${JSON.stringify(problem.constraints, null, 2)}`,
    `Evaluation focus: ${problem.evaluationFocus.join(", ")}`,
    "",
    "## Candidate design (JSON)",
    JSON.stringify(design, null, 2),
  ];

  if (priorFollowUp) {
    parts.push(
      "",
      "## Prior follow-up the candidate is answering",
      `Question: ${priorFollowUp.question}`,
      `Failure scenario: ${priorFollowUp.failureScenario}`,
      `Expected fix hints: ${priorFollowUp.expectedFixHints.join("; ")}`
    );
  }

  if (history && history.length > 0) {
    parts.push(
      "",
      "## Conversation history",
      ...history.slice(-6).map((m) => `${m.role}: ${m.content}`)
    );
  }

  parts.push(
    "",
    "Evaluate this design and return structured scores. If gaps remain, ask one sharp follow-up failure/load question."
  );

  return parts.join("\n");
}
