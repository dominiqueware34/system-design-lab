import { NextResponse } from "next/server";
import {
  fetchSeasonById,
  fetchSeasonPromptsPublic,
  listAttemptsForSeason,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOptionalUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/:id/me — auth required.
 * Private durations OK (owner view of own attempts + sessions).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id: seasonId } = await context.params;
  if (!seasonId) {
    return NextResponse.json({ error: "Missing season id" }, { status: 400 });
  }

  try {
    const nowMs = Date.now();
    const season = await fetchSeasonById(admin, seasonId, nowMs);
    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }
    const publicSeason = serializeSeasonPublic(season, nowMs);
    if (publicSeason.status === "draft") {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const [attempts, prompts, scoreRes, sessionsRes] = await Promise.all([
      listAttemptsForSeason(admin, { userId: user.id, seasonId }),
      fetchSeasonPromptsPublic(admin, seasonId),
      admin
        .from("campaign_season_scores")
        .select(
          "season_score, total_stars, prompts_scored, best_by_prompt, last_score_at, formula_id, updated_at"
        )
        .eq("user_id", user.id)
        .eq("season_id", seasonId)
        .maybeSingle(),
      admin
        .from("campaign_prompt_sessions")
        .select("prompt_id, started_at")
        .eq("user_id", user.id)
        .eq("season_id", seasonId),
    ]);

    if (scoreRes.error) throw scoreRes.error;
    if (sessionsRes.error) throw sessionsRes.error;

    const sessions = (sessionsRes.data ?? []) as Array<{
      prompt_id: string;
      started_at: string;
    }>;

    // Owner-private: include duration_ms on attempts + sticky startedAt.
    const attemptPayload = attempts.map((a) => ({
      id: a.id,
      promptId: a.prompt_id,
      attemptNumber: a.attempt_number,
      aiScore: a.ai_score,
      stars: a.stars,
      promptPoints: a.prompt_points != null ? Number(a.prompt_points) : null,
      durationMs: a.duration_ms,
      formulaId: a.formula_id,
      createdAt: a.created_at,
    }));

    const sessionPayload = sessions.map((s) => ({
      promptId: s.prompt_id,
      startedAt: s.started_at,
    }));

    const score = scoreRes.data;

    return NextResponse.json({
      season: publicSeason,
      score: score
        ? {
            seasonScore: Number(score.season_score ?? 0),
            totalStars: Number(score.total_stars ?? 0),
            promptsScored: Number(score.prompts_scored ?? 0),
            bestByPrompt: score.best_by_prompt ?? {},
            lastScoreAt: score.last_score_at ?? null,
            formulaId: score.formula_id ?? null,
            updatedAt: score.updated_at ?? null,
          }
        : null,
      attempts: attemptPayload,
      sessions: sessionPayload,
      promptCount: prompts.length,
    });
  } catch (err) {
    console.error("[api/campaign/seasons/:id/me]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load season progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
