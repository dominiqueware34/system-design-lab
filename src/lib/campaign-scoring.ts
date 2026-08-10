/**
 * Campaign scoring — pure functions for formula id `v1_correct_diff_cover`.
 *
 * Spec: docs/specs/solo-vs-campaign.md
 * Issue #17: prompt_points and season_score use Math.round; time is NOT in points.
 */

export const SCORE_FORMULA_ID = "v1_correct_diff_cover" as const;

/** Season prompt set size for coverage_mult (v1 = 20). */
export const SEASON_PROMPT_COUNT = 20;

export type CampaignDifficulty = "easy" | "medium" | "hard";

export const DIFF_MULT: Record<CampaignDifficulty, number> = {
  easy: 1.0,
  medium: 1.35,
  hard: 1.75,
};

/**
 * Map evaluate overall score (0–100) → AI stars / ai_score (1–5).
 * Equal bands of 20 points.
 */
export function aiScoreFromEvaluationScore(score: number): number {
  if (!Number.isFinite(score)) return 1;
  const clamped = Math.min(100, Math.max(0, score));
  // 0–19 → 1, 20–39 → 2, 40–59 → 3, 60–79 → 4, 80–100 → 5
  return Math.min(5, Math.max(1, Math.floor(clamped / 20) + 1));
}

/** Stars equal ai_score for this formula (1–5). */
export function starsFromAiScore(aiScore: number): number {
  return Math.min(5, Math.max(1, Math.round(aiScore)));
}

export function diffMult(difficulty: CampaignDifficulty | string): number {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    return DIFF_MULT[difficulty];
  }
  return DIFF_MULT.medium;
}

/**
 * prompt_points = round(ai_score * diff_mult)
 * TIME NOT IN POINTS.
 */
export function promptPoints(aiScore: number, difficulty: CampaignDifficulty | string): number {
  const stars = starsFromAiScore(aiScore);
  return Math.round(stars * diffMult(difficulty));
}

/**
 * coverage_mult = 0.55 + 0.45 * (N / 20)
 * N = prompts scored (≥1 star counted attempt).
 */
export function coverageMult(
  promptsScored: number,
  seasonPromptCount: number = SEASON_PROMPT_COUNT
): number {
  const n = Math.max(0, promptsScored);
  const denom = seasonPromptCount > 0 ? seasonPromptCount : SEASON_PROMPT_COUNT;
  return 0.55 + 0.45 * (n / denom);
}

/**
 * season_score = round(sum(prompt_points) * coverage_mult)
 */
export function seasonScore(
  sumPromptPoints: number,
  promptsScored: number,
  seasonPromptCount: number = SEASON_PROMPT_COUNT
): number {
  const mult = coverageMult(promptsScored, seasonPromptCount);
  return Math.round(sumPromptPoints * mult);
}

export type BestPromptSnapshot = {
  promptId: string;
  promptKey?: string;
  difficulty: CampaignDifficulty | string;
  aiScore: number;
  stars: number;
  promptPoints: number;
  attemptNumber: number;
};

/**
 * Aggregate season totals from per-prompt best snapshots.
 * Does not include duration/time fields.
 */
export function aggregateSeasonScore(
  bests: BestPromptSnapshot[],
  seasonPromptCount: number = SEASON_PROMPT_COUNT
): {
  seasonScore: number;
  totalStars: number;
  promptsScored: number;
  sumPromptPoints: number;
  coverageMult: number;
  formulaId: typeof SCORE_FORMULA_ID;
} {
  // Only count prompts with ≥1 star (all valid ai_score are 1–5).
  const scored = bests.filter((b) => starsFromAiScore(b.aiScore) >= 1);
  const sum = scored.reduce((acc, b) => acc + b.promptPoints, 0);
  const totalStars = scored.reduce((acc, b) => acc + starsFromAiScore(b.stars ?? b.aiScore), 0);
  const n = scored.length;
  const mult = coverageMult(n, seasonPromptCount);
  return {
    seasonScore: seasonScore(sum, n, seasonPromptCount),
    totalStars,
    promptsScored: n,
    sumPromptPoints: sum,
    coverageMult: mult,
    formulaId: SCORE_FORMULA_ID,
  };
}

/** Prefer higher ai_score; tie → lower attempt_number (first best). */
export function isBetterAttempt(
  candidate: { aiScore: number; attemptNumber: number },
  current: { aiScore: number; attemptNumber: number } | null
): boolean {
  if (!current) return true;
  if (candidate.aiScore > current.aiScore) return true;
  if (candidate.aiScore < current.aiScore) return false;
  return candidate.attemptNumber < current.attemptNumber;
}

export function maxAttemptsFromRules(rules: unknown, fallback = 3): number {
  if (rules && typeof rules === "object" && !Array.isArray(rules)) {
    const m = (rules as { max_attempts?: unknown }).max_attempts;
    if (typeof m === "number" && Number.isFinite(m) && m >= 1) {
      return Math.min(10, Math.floor(m));
    }
  }
  return fallback;
}

export function scoreFormulaFromRules(rules: unknown): string {
  if (rules && typeof rules === "object" && !Array.isArray(rules)) {
    const f = (rules as { score_formula?: unknown }).score_formula;
    if (typeof f === "string" && f.length > 0) return f;
  }
  return SCORE_FORMULA_ID;
}
