import { NextResponse } from "next/server";
import {
  fetchSeasonById,
  fetchSeasonPromptsPublic,
  serializePromptPublic,
  serializeSeasonPublic,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOptionalUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/campaign/seasons/:id/prompts — auth required.
 * Strips reference_design / rationale (column-limited select).
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
    const season = await fetchSeasonById(admin, seasonId);
    if (!season || season.status === "draft") {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const prompts = await fetchSeasonPromptsPublic(admin, seasonId);
    return NextResponse.json({
      season: serializeSeasonPublic(season),
      prompts: prompts.map(serializePromptPublic),
    });
  } catch (err) {
    console.error("[api/campaign/seasons/:id/prompts]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load prompts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
