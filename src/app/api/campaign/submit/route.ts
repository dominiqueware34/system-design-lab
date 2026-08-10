import { NextResponse } from "next/server";
import {
  countAttempts,
  ensurePromptSession,
  fetchPromptPublic,
  fetchSeasonById,
  fetchSeasonPromptsPublic,
  insertAttempt,
  recomputeSeasonScore,
} from "@/lib/campaign-db";
import { evaluateCampaignDesign, problemFromJson } from "@/lib/campaign-evaluate";
import {
  SCORE_FORMULA_ID,
  aiScoreFromEvaluationScore,
  maxAttemptsFromRules,
  promptPoints,
  scoreFormulaFromRules,
  starsFromAiScore,
} from "@/lib/campaign-scoring";
import type { DesignGraph } from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOptionalUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type SubmitBody = {
  promptId?: string;
  design?: DesignGraph;
  /** Ignored if present — server-authoritative. */
  score?: unknown;
  aiScore?: unknown;
  stars?: unknown;
  promptPoints?: unknown;
  seasonScore?: unknown;
  durationMs?: unknown;
  duration_ms?: unknown;
};

/**
 * POST /api/campaign/submit — auth required.
 * - Max 3 attempts per prompt (season rules)
 * - Server evaluates design; ignores client score fields
 * - Sticky timer → private duration_ms
 * - Recomputes season_score with v1_correct_diff_cover
 */
export async function POST(req: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Campaign seasons API requires Supabase + SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 503 }
    );
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const design = body.design;

  if (!promptId || !design || !Array.isArray(design.nodes)) {
    return NextResponse.json(
      { error: "promptId and design (with nodes) are required" },
      { status: 400 }
    );
  }

  // Explicitly discard any client-forged score fields.
  void body.score;
  void body.aiScore;
  void body.stars;
  void body.promptPoints;
  void body.seasonScore;
  void body.durationMs;
  void body.duration_ms;

  try {
    const prompt = await fetchPromptPublic(admin, promptId);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const season = await fetchSeasonById(admin, prompt.season_id);
    if (!season || season.status !== "live") {
      return NextResponse.json(
        { error: "Season is not open for submissions" },
        { status: 403 }
      );
    }

    const formula = scoreFormulaFromRules(season.rules);
    if (formula !== SCORE_FORMULA_ID) {
      return NextResponse.json(
        { error: `Unsupported score_formula: ${formula}` },
        { status: 400 }
      );
    }

    const maxAttempts = maxAttemptsFromRules(season.rules, 3);
    const priorCount = await countAttempts(admin, {
      userId: user.id,
      seasonId: season.id,
      promptId,
    });

    if (priorCount >= maxAttempts) {
      return NextResponse.json(
        {
          error: "Maximum attempts reached for this prompt",
          maxAttempts,
          attemptsUsed: priorCount,
        },
        { status: 409 }
      );
    }

    const session = await ensurePromptSession(admin, {
      userId: user.id,
      seasonId: season.id,
      promptId,
    });

    const startedMs = Date.parse(session.started_at);
    const durationMs = Number.isFinite(startedMs)
      ? Math.max(0, Date.now() - startedMs)
      : 0;

    const problem = problemFromJson(prompt.problem);
    if (!problem) {
      return NextResponse.json(
        { error: "Prompt problem payload is invalid" },
        { status: 500 }
      );
    }

    // Server-authoritative AI evaluation (client scores ignored).
    let evaluation: Awaited<ReturnType<typeof evaluateCampaignDesign>>;
    try {
      evaluation = await evaluateCampaignDesign(problem, design);
    } catch (evalErr) {
      console.error("[api/campaign/submit] evaluate", evalErr);
      const message =
        evalErr instanceof Error ? evalErr.message : "Evaluation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const aiScore = aiScoreFromEvaluationScore(evaluation.score);
    const stars = starsFromAiScore(aiScore);
    const points = promptPoints(aiScore, prompt.difficulty);
    const attemptNumber = priorCount + 1;

    const attempt = await insertAttempt(admin, {
      user_id: user.id,
      season_id: season.id,
      prompt_id: promptId,
      attempt_number: attemptNumber,
      design,
      ai_score: aiScore,
      stars,
      prompt_points: points,
      duration_ms: durationMs,
      formula_id: SCORE_FORMULA_ID,
    });

    const allPrompts = await fetchSeasonPromptsPublic(admin, season.id);
    const seasonAgg = await recomputeSeasonScore(admin, {
      userId: user.id,
      seasonId: season.id,
      prompts: allPrompts,
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        promptId,
        seasonId: season.id,
        attemptNumber: attempt.attempt_number,
        aiScore,
        stars,
        promptPoints: points,
        // Private duration OK on submit response (owner only).
        durationMs,
        formulaId: SCORE_FORMULA_ID,
        createdAt: attempt.created_at,
      },
      evaluation: {
        score: evaluation.score,
        summary: evaluation.summary,
        strengths: evaluation.strengths,
        gaps: evaluation.gaps,
        isComplete: evaluation.isComplete,
      },
      season: {
        seasonScore: seasonAgg.season_score,
        totalStars: seasonAgg.total_stars,
        promptsScored: seasonAgg.prompts_scored,
        formulaId: seasonAgg.formula_id,
        bestByPrompt: seasonAgg.best_by_prompt,
      },
      attemptsRemaining: Math.max(0, maxAttempts - attemptNumber),
      maxAttempts,
      // Echo that client-sent scores were ignored.
      serverAuthoritative: true,
    });
  } catch (err) {
    console.error("[api/campaign/submit]", err);
    const message =
      err instanceof Error ? err.message : "Failed to submit campaign attempt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
