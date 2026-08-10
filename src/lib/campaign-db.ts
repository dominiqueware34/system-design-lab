/**
 * Campaign season DB helpers (Artifact 5).
 * Prefer service role for writes and public reads; never return reference_design.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SCORE_FORMULA_ID,
  aggregateSeasonScore,
  isBetterAttempt,
  promptPoints,
  starsFromAiScore,
  type BestPromptSnapshot,
  type CampaignDifficulty,
} from "@/lib/campaign-scoring";

export type CampaignSeasonRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "live" | "ended" | string;
  starts_at: string | null;
  ends_at: string | null;
  rules: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type CampaignPromptPublic = {
  id: string;
  season_id: string;
  prompt_key: string;
  problem: unknown;
  difficulty: CampaignDifficulty | string;
  track: string;
  sort_order: number;
  created_at?: string;
};

export type CampaignAttemptRow = {
  id: string;
  user_id: string;
  season_id: string;
  prompt_id: string;
  attempt_number: number;
  design: unknown;
  ai_score: number | null;
  stars: number | null;
  prompt_points: number | null;
  duration_ms: number | null;
  formula_id: string;
  created_at: string;
};

const PUBLIC_PROMPT_COLUMNS =
  "id, season_id, prompt_key, problem, difficulty, track, sort_order, created_at";

/** Live season preferred (most recently started); null if none. */
export async function fetchCurrentSeason(
  admin: SupabaseClient
): Promise<CampaignSeasonRow | null> {
  const nowMs = Date.now();

  const { data: liveRows, error } = await admin
    .from("campaign_seasons")
    .select("*")
    .eq("status", "live")
    .order("starts_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  const rows = (liveRows ?? []) as CampaignSeasonRow[];
  if (rows.length === 0) return null;

  // Prefer a live season whose window contains now; else first live row.
  const inWindow = rows.find((s) => {
    const startOk =
      !s.starts_at || Date.parse(s.starts_at) <= nowMs;
    const endOk = !s.ends_at || Date.parse(s.ends_at) >= nowMs;
    return startOk && endOk;
  });
  return inWindow ?? rows[0] ?? null;
}

export async function fetchSeasonById(
  admin: SupabaseClient,
  seasonId: string
): Promise<CampaignSeasonRow | null> {
  const { data, error } = await admin
    .from("campaign_seasons")
    .select("*")
    .eq("id", seasonId)
    .maybeSingle();
  if (error) throw error;
  return (data as CampaignSeasonRow | null) ?? null;
}

/** Client-safe prompts — never selects reference_design / rationale. */
export async function fetchSeasonPromptsPublic(
  admin: SupabaseClient,
  seasonId: string
): Promise<CampaignPromptPublic[]> {
  const { data, error } = await admin
    .from("campaign_prompts")
    .select(PUBLIC_PROMPT_COLUMNS)
    .eq("season_id", seasonId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CampaignPromptPublic[];
}

export async function fetchPromptPublic(
  admin: SupabaseClient,
  promptId: string
): Promise<CampaignPromptPublic | null> {
  const { data, error } = await admin
    .from("campaign_prompts")
    .select(PUBLIC_PROMPT_COLUMNS)
    .eq("id", promptId)
    .maybeSingle();
  if (error) throw error;
  return (data as CampaignPromptPublic | null) ?? null;
}

/**
 * Sticky start: insert if missing; on conflict return existing started_at.
 * Never updates started_at.
 */
export async function ensurePromptSession(
  admin: SupabaseClient,
  params: { userId: string; seasonId: string; promptId: string }
): Promise<{ started_at: string; created: boolean; id: string }> {
  const { userId, seasonId, promptId } = params;

  const { data: existing, error: selErr } = await admin
    .from("campaign_prompt_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .eq("season_id", seasonId)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) {
    return {
      id: existing.id as string,
      started_at: existing.started_at as string,
      created: false,
    };
  }

  const { data: inserted, error: insErr } = await admin
    .from("campaign_prompt_sessions")
    .insert({
      user_id: userId,
      season_id: seasonId,
      prompt_id: promptId,
    })
    .select("id, started_at")
    .single();

  if (insErr) {
    // Race: another request inserted first — re-select (sticky).
    if (insErr.code === "23505") {
      const { data: raced, error: rErr } = await admin
        .from("campaign_prompt_sessions")
        .select("id, started_at")
        .eq("user_id", userId)
        .eq("season_id", seasonId)
        .eq("prompt_id", promptId)
        .single();
      if (rErr) throw rErr;
      return {
        id: raced.id as string,
        started_at: raced.started_at as string,
        created: false,
      };
    }
    throw insErr;
  }

  return {
    id: inserted.id as string,
    started_at: inserted.started_at as string,
    created: true,
  };
}

export async function countAttempts(
  admin: SupabaseClient,
  params: { userId: string; seasonId: string; promptId: string }
): Promise<number> {
  const { count, error } = await admin
    .from("campaign_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", params.userId)
    .eq("season_id", params.seasonId)
    .eq("prompt_id", params.promptId);
  if (error) throw error;
  return count ?? 0;
}

export async function listAttemptsForSeason(
  admin: SupabaseClient,
  params: { userId: string; seasonId: string }
): Promise<CampaignAttemptRow[]> {
  const { data, error } = await admin
    .from("campaign_attempts")
    .select("*")
    .eq("user_id", params.userId)
    .eq("season_id", params.seasonId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CampaignAttemptRow[];
}

export async function insertAttempt(
  admin: SupabaseClient,
  row: {
    user_id: string;
    season_id: string;
    prompt_id: string;
    attempt_number: number;
    design: unknown;
    ai_score: number;
    stars: number;
    prompt_points: number;
    duration_ms: number;
    formula_id?: string;
  }
): Promise<CampaignAttemptRow> {
  const { data, error } = await admin
    .from("campaign_attempts")
    .insert({
      ...row,
      formula_id: row.formula_id ?? SCORE_FORMULA_ID,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CampaignAttemptRow;
}

/**
 * Recompute campaign_season_scores from all attempts (best per prompt).
 * best_by_prompt never includes duration_ms.
 */
export async function recomputeSeasonScore(
  admin: SupabaseClient,
  params: {
    userId: string;
    seasonId: string;
    prompts: CampaignPromptPublic[];
  }
): Promise<{
  season_score: number;
  total_stars: number;
  prompts_scored: number;
  best_by_prompt: Record<string, unknown>;
  last_score_at: string | null;
  formula_id: string;
}> {
  const attempts = await listAttemptsForSeason(admin, {
    userId: params.userId,
    seasonId: params.seasonId,
  });

  const promptById = new Map(params.prompts.map((p) => [p.id, p]));
  const bestMap = new Map<
    string,
    BestPromptSnapshot & { lastCreatedAt: string }
  >();

  for (const a of attempts) {
    if (a.ai_score == null) continue;
    const prompt = promptById.get(a.prompt_id);
    const difficulty = prompt?.difficulty ?? "medium";
    const aiScore = a.ai_score;
    const stars = starsFromAiScore(a.stars ?? aiScore);
    const pts =
      a.prompt_points != null
        ? Number(a.prompt_points)
        : promptPoints(aiScore, difficulty);

    const snap: BestPromptSnapshot & { lastCreatedAt: string } = {
      promptId: a.prompt_id,
      promptKey: prompt?.prompt_key,
      difficulty,
      aiScore,
      stars,
      promptPoints: pts,
      attemptNumber: a.attempt_number,
      lastCreatedAt: a.created_at,
    };

    const cur = bestMap.get(a.prompt_id) ?? null;
    if (
      isBetterAttempt(
        { aiScore: snap.aiScore, attemptNumber: snap.attemptNumber },
        cur
          ? { aiScore: cur.aiScore, attemptNumber: cur.attemptNumber }
          : null
      )
    ) {
      bestMap.set(a.prompt_id, snap);
    }
  }

  const bests = [...bestMap.values()];
  const agg = aggregateSeasonScore(bests);

  const best_by_prompt: Record<string, unknown> = {};
  let lastScoreAt: string | null = null;
  for (const b of bests) {
    // No duration fields — public LB invariant.
    best_by_prompt[b.promptId] = {
      prompt_key: b.promptKey ?? null,
      difficulty: b.difficulty,
      ai_score: b.aiScore,
      stars: b.stars,
      prompt_points: b.promptPoints,
      attempt_number: b.attemptNumber,
    };
    const created = (b as { lastCreatedAt?: string }).lastCreatedAt;
    if (created && (!lastScoreAt || created > lastScoreAt)) {
      lastScoreAt = created;
    }
  }

  const payload = {
    user_id: params.userId,
    season_id: params.seasonId,
    season_score: agg.seasonScore,
    total_stars: agg.totalStars,
    prompts_scored: agg.promptsScored,
    best_by_prompt,
    last_score_at: lastScoreAt,
    formula_id: SCORE_FORMULA_ID,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("campaign_season_scores")
    .upsert(payload, { onConflict: "user_id,season_id" });
  if (error) throw error;

  return {
    season_score: agg.seasonScore,
    total_stars: agg.totalStars,
    prompts_scored: agg.promptsScored,
    best_by_prompt,
    last_score_at: lastScoreAt,
    formula_id: SCORE_FORMULA_ID,
  };
}

/** Public leaderboard rows — strip any accidental duration keys. */
export function sanitizeLeaderboardRow(row: Record<string, unknown>) {
  const safe = { ...row };
  delete safe.duration_ms;
  delete safe.durationMs;
  delete safe.started_at;
  delete safe.startedAt;
  return safe;
}

export async function fetchLeaderboard(
  admin: SupabaseClient,
  seasonId: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  const { data, error } = await admin
    .from("campaign_leaderboard")
    .select(
      "season_id, user_id, season_score, total_stars, prompts_scored, last_score_at, formula_id, updated_at, display_name, avatar_url"
    )
    .eq("season_id", seasonId)
    .order("season_score", { ascending: false })
    .order("last_score_at", { ascending: true, nullsFirst: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) throw error;
  return (data ?? []).map((r) => sanitizeLeaderboardRow(r as Record<string, unknown>));
}

export function serializeSeasonPublic(season: CampaignSeasonRow) {
  return {
    id: season.id,
    slug: season.slug,
    title: season.title,
    status: season.status,
    startsAt: season.starts_at,
    endsAt: season.ends_at,
    rules: season.rules ?? {
      score_formula: SCORE_FORMULA_ID,
      max_attempts: 3,
    },
  };
}

export function serializePromptPublic(p: CampaignPromptPublic) {
  return {
    id: p.id,
    seasonId: p.season_id,
    promptKey: p.prompt_key,
    problem: p.problem,
    difficulty: p.difficulty,
    track: p.track,
    sortOrder: p.sort_order,
    // reference_design intentionally omitted
  };
}
