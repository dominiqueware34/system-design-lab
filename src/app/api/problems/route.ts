import { NextResponse } from "next/server";
import { PROBLEMS } from "@/lib/problems";

export const runtime = "nodejs";

/**
 * GET /api/problems — full problem catalog from constants (content API).
 * Optional ?track=classic|agentic
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const track = searchParams.get("track");

  let list = PROBLEMS;
  if (track === "classic" || track === "agentic") {
    list = PROBLEMS.filter((p) => p.track === track);
  }

  return NextResponse.json({
    problems: list.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      track: p.track,
      summary: p.summary,
      evaluationFocus: p.evaluationFocus,
    })),
    count: list.length,
  });
}
