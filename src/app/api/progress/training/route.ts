import { NextResponse } from "next/server";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import {
  fetchTrainingProgress,
  upsertTrainingProgress,
} from "@/lib/progress-db";
import type { TrainingProgress } from "@/lib/training-lessons";

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
    const progress = await fetchTrainingProgress(supabase, user.id);
    return NextResponse.json(
      progress ?? {
        completedLessonIds: [],
      }
    );
  } catch (err) {
    console.error("[api/progress/training] GET", err);
    const message = err instanceof Error ? err.message : "Failed to load progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getOptionalUser();
  if (!user) return unauthorized();

  const supabase = await createClient();
  if (!supabase) return unauthorized();

  let body: TrainingProgress;
  try {
    body = (await req.json()) as TrainingProgress;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 });
  }

  const progress: TrainingProgress = {
    completedLessonIds: Array.isArray(body.completedLessonIds)
      ? body.completedLessonIds.filter((id): id is string => typeof id === "string")
      : [],
    ...(typeof body.lastLessonId === "string"
      ? { lastLessonId: body.lastLessonId }
      : {}),
  };

  try {
    const saved = await upsertTrainingProgress(supabase, user, progress);
    return NextResponse.json(saved);
  } catch (err) {
    console.error("[api/progress/training] PUT", err);
    const message = err instanceof Error ? err.message : "Failed to save progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
