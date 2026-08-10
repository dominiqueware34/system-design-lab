import { NextResponse } from "next/server";
import {
  ensurePromptSession,
  fetchPromptPublic,
  fetchSeasonById,
  isSeasonOpenForPlay,
} from "@/lib/campaign-db";
import { createServiceClient } from "@/lib/supabase/admin";
import { getOptionalUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/campaign/prompts/:promptId/start — auth required.
 * Sticky started_at: first open wins; resubmit/restart does not reset the timer.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ promptId: string }> }
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

  const { promptId } = await context.params;
  if (!promptId) {
    return NextResponse.json({ error: "Missing prompt id" }, { status: 400 });
  }

  try {
    const prompt = await fetchPromptPublic(admin, promptId);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const season = await fetchSeasonById(admin, prompt.season_id);
    if (!season || !isSeasonOpenForPlay(season)) {
      return NextResponse.json(
        {
          error: "Season is not open for play",
          reason: "season_frozen_or_ended",
        },
        { status: 403 }
      );
    }

    const session = await ensurePromptSession(admin, {
      userId: user.id,
      seasonId: prompt.season_id,
      promptId,
    });

    return NextResponse.json({
      promptId,
      seasonId: prompt.season_id,
      startedAt: session.started_at,
      created: session.created,
      sticky: true,
    });
  } catch (err) {
    console.error("[api/campaign/prompts/:promptId/start]", err);
    const message =
      err instanceof Error ? err.message : "Failed to start prompt session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
