import { NextResponse } from "next/server";
import {
  fetchCurrentSeason,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/current — public (any).
 * Returns the effectively live season for competitive play, or null.
 * Honors ends_at/starts_at (pure effective status; no DB status write).
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
    return NextResponse.json({
      season: season ? serializeSeasonPublic(season, nowMs) : null,
    });
  } catch (err) {
    console.error("[api/campaign/seasons/current]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load current season";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
