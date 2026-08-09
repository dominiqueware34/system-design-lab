import { NextResponse } from "next/server";
import { getProblemById } from "@/lib/problems";

export const runtime = "nodejs";

/**
 * GET /api/problems/[id] — single design problem from constants.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const problem = getProblemById(id);
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }
  return NextResponse.json({ problem });
}
