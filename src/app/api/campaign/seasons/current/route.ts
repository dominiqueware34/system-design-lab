import { NextResponse } from "next/server";
import {
  fetchCurrentSeason,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/current — public (any).
 * Returns the live season metadata, or null season when none is live.
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
    const season = await fetchCurrentSeason(admin);
    if (!season) {
      return NextResponse.json({ season: null });
    }
    return NextResponse.json({ season: serializeSeasonPublic(season) });
  } catch (err) {
    console.error("[api/campaign/seasons/current]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load current season";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
