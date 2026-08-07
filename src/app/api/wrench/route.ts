import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { model } from "@/lib/ai";
import { wrenchEvalSchema, wrenchSchema } from "@/lib/wrench-schema";
import type { DesignGraph, DesignProblem, DesignWrench } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mode = "throw" | "evaluate";

interface WrenchBody {
  mode: Mode;
  problem: DesignProblem;
  design: DesignGraph;
  /** When throwing: how many wrenches already survived this level */
  wrenchIndex?: number;
  totalWrenches?: number;
  /** Avoid repeating categories if possible */
  previousWrenches?: DesignWrench[];
  /** When evaluating a fix */
  wrench?: DesignWrench;
  passScore?: number;
}

const THROW_SYSTEM = `You are the Chaos Engineer / Dungeon Master of a system design campaign game.

The player just submitted an architecture (JSON graph of components + attributes + edges).
Your job: throw a **wrench** — a realistic production incident that exploits a weakness in *their* design.

Rules:
- Base the wrench on the ACTUAL graph: missing replicas, single DB, no cache, no rate limit, no multi-AZ, no RAG evals, no DLQ, SPOF load balancer, etc.
- If the design is strong, still invent a harsh scale/security/regional failure that stresses it.
- Categories: latency, security, capacity, failure, cost, data, evals, agent
- Be specific and cinematic (game event), but technically accurate
- expectedFixHints should point to catalog components when possible
- severity 1 = annoying, 2 = outage risk, 3 = company-on-fire
- Never solve the design for them — only the incident + what they must address
- Prefer different category than previous wrenches when provided`;

const EVAL_SYSTEM = `You are grading whether a player fixed a chaos "wrench" in their system design game.

They submitted an updated architecture JSON after you threw an incident.
Judge:
1. Did they specifically mitigate THIS wrench (not just add random boxes)?
2. Overall design quality for the problem difficulty
3. passLevel = true only if the wrench is addressed AND the design is solid enough for this stage (score roughly >= passScore)

Be fair but strict. Cosmetic renames do not count as fixes.`;

export async function POST(req: Request) {
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Missing XAI_API_KEY. Add it to .env.local. Get a key at https://console.x.ai",
      },
      { status: 500 }
    );
  }

  let body: WrenchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mode, problem, design } = body;
  if (!mode || !problem?.id || !design) {
    return NextResponse.json(
      { error: "mode, problem, and design are required" },
      { status: 400 }
    );
  }

  try {
    if (mode === "throw") {
      const wrenchIndex = body.wrenchIndex ?? 0;
      const totalWrenches = body.totalWrenches ?? 1;
      const prev = body.previousWrenches ?? [];

      const { object } = await generateObject({
        model,
        schema: wrenchSchema,
        system: THROW_SYSTEM,
        temperature: 0.7,
        prompt: [
          `## Problem (${problem.track} / ${problem.difficulty})`,
          problem.title,
          problem.description,
          `Requirements: ${problem.requirements.join("; ")}`,
          `Constraints: ${JSON.stringify(problem.constraints)}`,
          "",
          `## Player design JSON`,
          JSON.stringify(design, null, 2),
          "",
          `This is wrench ${wrenchIndex + 1} of ${totalWrenches} for this level.`,
          prev.length
            ? `Previous wrenches (do not repeat): ${prev.map((w) => w.category + ":" + w.title).join("; ")}`
            : "No previous wrenches.",
          "Throw one sharp, design-specific wrench.",
        ].join("\n"),
      });

      return NextResponse.json(object);
    }

    // evaluate fix
    if (!body.wrench) {
      return NextResponse.json(
        { error: "wrench is required for evaluate mode" },
        { status: 400 }
      );
    }

    const passScore = body.passScore ?? 60;
    const { object } = await generateObject({
      model,
      schema: wrenchEvalSchema,
      system: EVAL_SYSTEM,
      temperature: 0.3,
      prompt: [
        `## Problem`,
        problem.title,
        `Track: ${problem.track} Difficulty: ${problem.difficulty}`,
        `Pass score threshold: ${passScore}`,
        "",
        `## Active wrench`,
        JSON.stringify(body.wrench, null, 2),
        "",
        `## Updated design JSON`,
        JSON.stringify(design, null, 2),
        "",
        "Did they fix the wrench? May they pass the level?",
      ].join("\n"),
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Wrench API failed:", err);
    const message = err instanceof Error ? err.message : "Wrench failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
