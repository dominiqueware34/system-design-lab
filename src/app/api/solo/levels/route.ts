import { NextResponse } from "next/server";
import { SOLO_LEVELS, serializeSoloLevel } from "@/lib/solo-levels";

export const runtime = "nodejs";

/**
 * GET /api/solo/levels — Solo multi-problem level config from constants.
 * Progress is not included (client localStorage + /api/progress/solo).
 */
export async function GET() {
  return NextResponse.json({
    levels: SOLO_LEVELS.map(serializeSoloLevel),
  });
}
