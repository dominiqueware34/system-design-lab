import { NextResponse } from "next/server";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { fetchSoloProgress, upsertSoloProgress } from "@/lib/progress-db";
import { normalizeSoloProgress } from "@/lib/solo-levels";
import type { SoloProgress } from "@/lib/types";

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
    const progress = await fetchSoloProgress(supabase, user.id);
    return NextResponse.json(
      progress ?? {
        problems: {},
        completedLevelIds: [],
      }
    );
  } catch (err) {
    console.error("[api/progress/solo] GET", err);
    const message = err instanceof Error ? err.message : "Failed to load progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getOptionalUser();
  if (!user) return unauthorized();

  const supabase = await createClient();
  if (!supabase) return unauthorized();

  let body: SoloProgress;
  try {
    body = (await req.json()) as SoloProgress;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 });
  }

  const progress = normalizeSoloProgress(body);

  try {
    const saved = await upsertSoloProgress(supabase, user, progress);
    return NextResponse.json(saved);
  } catch (err) {
    console.error("[api/progress/solo] PUT", err);
    const message = err instanceof Error ? err.message : "Failed to save progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
