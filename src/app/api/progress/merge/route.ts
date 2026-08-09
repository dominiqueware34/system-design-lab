import { NextResponse } from "next/server";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { mergeAndPersist } from "@/lib/progress-db";
import type { CampaignProgress, SoloProgress } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface MergeBody {
  campaign?: CampaignProgress | null;
  training?: TrainingProgress | null;
  solo?: SoloProgress | null;
}

export async function POST(req: Request) {
  const user = await getOptionalUser();
  if (!user) return unauthorized();

  const supabase = await createClient();
  if (!supabase) return unauthorized();

  let body: MergeBody;
  try {
    body = (await req.json()) as MergeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await mergeAndPersist(
      supabase,
      user,
      body.campaign ?? null,
      body.training ?? null,
      body.solo ?? null
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/progress/merge] POST", err);
    const message = err instanceof Error ? err.message : "Merge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
