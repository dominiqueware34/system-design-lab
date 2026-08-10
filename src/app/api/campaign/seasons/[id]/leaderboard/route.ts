import { NextResponse } from "next/server";
import {
  fetchLeaderboard,
  fetchSeasonById,
  sanitizeLeaderboardRow,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/:id/leaderboard — public (any).
 * INVARIANT: no duration / started_at / duration_ms fields.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

  try {
    const nowMs = Date.now();
    const season = await fetchSeasonById(admin, seasonId);
    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }
    const publicSeason = serializeSeasonPublic(season, nowMs);
    if (publicSeason.status === "draft") {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const rows = await fetchLeaderboard(admin, seasonId, limit);

    // Defense in depth: strip any duration keys before responding.
    const entries = rows.map((r) => {
      const safe = sanitizeLeaderboardRow(r);
      return {
        rank: 0, // filled below
        userId: safe.user_id,
        displayName: safe.display_name ?? null,
        avatarUrl: safe.avatar_url ?? null,
        seasonScore: Number(safe.season_score ?? 0),
        totalStars: Number(safe.total_stars ?? 0),
        promptsScored: Number(safe.prompts_scored ?? 0),
        lastScoreAt: safe.last_score_at ?? null,
        formulaId: safe.formula_id ?? null,
      };
    });

    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    // Final payload shape has no duration fields by construction.
    return NextResponse.json({
      season: publicSeason,
      leaderboard: entries,
    });
  } catch (err) {
    console.error("[api/campaign/seasons/:id/leaderboard]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
