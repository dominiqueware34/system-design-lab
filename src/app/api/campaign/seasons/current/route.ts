import { NextResponse } from "next/server";
import {
  fetchCurrentSeason,
  fetchMostRecentEndedSeason,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/current — public (any).
 * - `season`: effectively live season for competitive play, or null
 * - `endedSeason`: most recent ended season (for post-season reference reveal / LB)
 * Effective status honors ends_at (expired live is synced to ended).
 */
export async function GET() {
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

  try {
    const nowMs = Date.now();
    const season = await fetchCurrentSeason(admin, nowMs);
    if (season) {
      return NextResponse.json({
        season: serializeSeasonPublic(season, nowMs),
        endedSeason: null,
      });
    }
    const ended = await fetchMostRecentEndedSeason(admin, nowMs);
    return NextResponse.json({
      season: null,
      endedSeason: ended ? serializeSeasonPublic(ended, nowMs) : null,
    });
  } catch (err) {
    console.error("[api/campaign/seasons/current]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load current season";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
