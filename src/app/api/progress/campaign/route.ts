import { NextResponse } from "next/server";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import {
  fetchCampaignProgress,
  upsertCampaignProgress,
} from "@/lib/progress-db";
import type { CampaignProgress } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await getOptionalUser();
  if (!user) return unauthorized();

  const supabase = await createClient();
  if (!supabase) return unauthorized();

  try {
    const progress = await fetchCampaignProgress(supabase, user.id);
    return NextResponse.json(
      progress ?? {
        completedLevelIds: [],
        stars: {},
        wrenchesSurvived: 0,
      }
    );
  } catch (err) {
    console.error("[api/progress/campaign] GET", err);
    const message = err instanceof Error ? err.message : "Failed to load progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getOptionalUser();
  if (!user) return unauthorized();

  const supabase = await createClient();
  if (!supabase) return unauthorized();

  let body: CampaignProgress;
  try {
    body = (await req.json()) as CampaignProgress;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 });
  }

  const progress: CampaignProgress = {
    completedLevelIds: Array.isArray(body.completedLevelIds)
      ? body.completedLevelIds.filter((id): id is string => typeof id === "string")
      : [],
    stars:
      body.stars && typeof body.stars === "object" && !Array.isArray(body.stars)
        ? Object.fromEntries(
            Object.entries(body.stars).map(([k, v]) => [
              k,
              typeof v === "number" ? v : 0,
            ])
          )
        : {},
    wrenchesSurvived:
      typeof body.wrenchesSurvived === "number" ? body.wrenchesSurvived : 0,
    ...(typeof body.lastPlayedLevelId === "string"
      ? { lastPlayedLevelId: body.lastPlayedLevelId }
      : {}),
  };

  try {
    const saved = await upsertCampaignProgress(supabase, user, progress);
    return NextResponse.json(saved);
  } catch (err) {
    console.error("[api/progress/campaign] PUT", err);
    const message = err instanceof Error ? err.message : "Failed to save progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
