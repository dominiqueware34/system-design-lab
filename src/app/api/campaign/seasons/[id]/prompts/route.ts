import { NextResponse } from "next/server";
import {
  fetchSeasonById,
  fetchSeasonPromptsPublic,
  mayRevealReferenceDesign,
  serializePromptPublic,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOptionalUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/:id/prompts — auth required.
 * Strips reference_design / rationale while live/draft.
 * When season is effectively ended, includes referenceDesign + rationale.
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

    // Draft seasons are not visible to players (operator-only).
    const publicSeason = serializeSeasonPublic(season, nowMs);
    if (publicSeason.status === "draft") {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const reveal = mayRevealReferenceDesign(season, nowMs);
    const prompts = await fetchSeasonPromptsPublic(admin, seasonId, {
      includeReference: reveal,
    });

    return NextResponse.json({
      season: publicSeason,
      prompts: prompts.map((p) =>
        serializePromptPublic(p, { includeReference: reveal })
      ),
      referenceRevealed: reveal,
    });
  } catch (err) {
    console.error("[api/campaign/seasons/:id/prompts]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load prompts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
