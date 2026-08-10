/**
 * Client-side Campaign season API helpers (Artifact 6).
 * Never expects reference_design in responses.
 */

import type { DesignGraph, DesignProblem } from "@/lib/types";

export type CampaignSeasonPublic = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  rules: Record<string, unknown> | null;
};

export type CampaignPromptClient = {
  id: string;
  seasonId: string;
  promptKey: string;
  problem: unknown;
  difficulty: string;
  track: string;
  sortOrder: number;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  seasonScore: number;
  totalStars: number;
  promptsScored: number;
  lastScoreAt: string | null;
  formulaId: string | null;
};

export type MeAttempt = {
  id: string;
  promptId: string;
  attemptNumber: number;
  aiScore: number | null;
  stars: number | null;
  promptPoints: number | null;
  durationMs: number | null;
  formulaId: string | null;
  createdAt: string;
};

export type MeSession = {
  promptId: string;
  startedAt: string;
};

export type MeScore = {
  seasonScore: number;
  totalStars: number;
  promptsScored: number;
  bestByPrompt: Record<string, unknown>;
  lastScoreAt: string | null;
  formulaId: string | null;
  updatedAt: string | null;
};

export type CampaignSubmitResult = {
  attempt: {
    id: string;
    promptId: string;
    seasonId: string;
    attemptNumber: number;
    aiScore: number;
    stars: number;
    promptPoints: number;
    durationMs: number;
    formulaId: string;
    createdAt: string;
  };
  evaluation: {
    score: number;
    summary: string;
    strengths: string[];
    gaps: string[];
    isComplete: boolean;
  };
  season: {
    seasonScore: number;
    totalStars: number;
    promptsScored: number;
    formulaId: string;
    bestByPrompt: Record<string, unknown>;
  };
  attemptsRemaining: number;
  maxAttempts: number;
  serverAuthoritative: boolean;
  error?: string;
};

async function readJson<T>(res: Response): Promise<T & { error?: string }> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchCurrentSeason(): Promise<CampaignSeasonPublic | null> {
  const res = await fetch("/api/campaign/seasons/current");
  const data = await readJson<{ season: CampaignSeasonPublic | null }>(res);
  return data.season;
}

export async function fetchSeasonPrompts(
  seasonId: string
): Promise<{
  season: CampaignSeasonPublic;
  prompts: CampaignPromptClient[];
}> {
  const res = await fetch(`/api/campaign/seasons/${seasonId}/prompts`);
  return readJson(res);
}

export async function fetchLeaderboard(
  seasonId: string,
  limit = 50
): Promise<{
  season: CampaignSeasonPublic;
  leaderboard: LeaderboardEntry[];
}> {
  const res = await fetch(
    `/api/campaign/seasons/${seasonId}/leaderboard?limit=${limit}`
  );
  return readJson(res);
}

export async function fetchMySeason(
  seasonId: string
): Promise<{
  season: CampaignSeasonPublic;
  score: MeScore | null;
  attempts: MeAttempt[];
  sessions: MeSession[];
  promptCount: number;
}> {
  const res = await fetch(`/api/campaign/seasons/${seasonId}/me`);
  return readJson(res);
}

export async function startPromptSession(promptId: string): Promise<{
  promptId: string;
  seasonId: string;
  startedAt: string;
  created: boolean;
  sticky: boolean;
}> {
  const res = await fetch(`/api/campaign/prompts/${promptId}/start`, {
    method: "POST",
  });
  return readJson(res);
}

export async function submitCampaignDesign(
  promptId: string,
  design: DesignGraph
): Promise<CampaignSubmitResult> {
  const res = await fetch("/api/campaign/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptId, design }),
  });
  return readJson(res);
}

/** Coerce API problem payload → DesignProblem (client-safe; no reference). */
export function problemFromPromptPayload(raw: unknown): DesignProblem | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.title !== "string") return null;
  return {
    id: p.id,
    title: p.title,
    difficulty: (p.difficulty as DesignProblem["difficulty"]) ?? "medium",
    track: (p.track as DesignProblem["track"]) ?? "classic",
    summary: typeof p.summary === "string" ? p.summary : "",
    description: typeof p.description === "string" ? p.description : "",
    requirements: Array.isArray(p.requirements)
      ? p.requirements.filter((x): x is string => typeof x === "string")
      : [],
    constraints:
      p.constraints && typeof p.constraints === "object"
        ? (p.constraints as DesignProblem["constraints"])
        : {},
    evaluationFocus: Array.isArray(p.evaluationFocus)
      ? p.evaluationFocus.filter((x): x is string => typeof x === "string")
      : [],
    ...(Array.isArray(p.hints)
      ? { hints: p.hints.filter((x): x is string => typeof x === "string") }
      : {}),
  };
}

export function maxAttemptsFromRules(
  rules: Record<string, unknown> | null | undefined,
  fallback = 3
): number {
  if (!rules) return fallback;
  const n = rules.max_attempts;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) return Math.floor(n);
  return fallback;
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatCountdown(endsAt: string | null | undefined): string {
  if (!endsAt) return "—";
  const end = Date.parse(endsAt);
  if (!Number.isFinite(end)) return "—";
  const diff = end - Date.now();
  if (diff <= 0) return "Ended";
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export const SEASON_PROMPT_TARGET = 20;
