import type {
  CampaignProgress,
  SoloLevel,
  SoloLevelProblemRef,
  SoloProblemRecord,
  SoloProgress,
} from "./types";
import { getProblemById } from "./problems";

/**
 * Solo Mode multi-problem levels (v1).
 * Data-driven — problem set may grow; do not hard-code “exactly 16 forever”.
 *
 * - solo-l1 Foundations: classic catalog (~10)
 * - solo-l2 Agentic Frontier: agentic catalog (~6); unlocks after L1 complete
 */
export const SOLO_LEVELS: SoloLevel[] = [
  {
    id: "solo-l1",
    title: "Foundations",
    description:
      "Classic distributed systems: hashing, caching, scale, realtime, and multi-tenant design.",
    track: "classic",
    unlocksAfter: [],
    problems: [
      { problemId: "url-shortener", passScore: 55, order: 1 },
      { problemId: "rate-limiter-service", passScore: 55, order: 2 },
      { problemId: "distributed-kv", passScore: 55, order: 3 },
      { problemId: "global-id-generator", passScore: 58, order: 4 },
      { problemId: "chat-system", passScore: 60, order: 5 },
      { problemId: "news-feed", passScore: 60, order: 6 },
      { problemId: "ride-sharing", passScore: 62, order: 7 },
      { problemId: "video-streaming", passScore: 62, order: 8 },
      { problemId: "payment-system", passScore: 65, order: 9 },
      { problemId: "multi-tenant-saas-db", passScore: 65, order: 10 },
    ],
  },
  {
    id: "solo-l2",
    title: "Agentic Frontier",
    description:
      "Agentic AI architectures: RAG, tools, multi-agent, coding agents, platforms, and evals.",
    track: "agentic",
    unlocksAfter: ["solo-l1"],
    problems: [
      { problemId: "rag-support-agent", passScore: 58, order: 1 },
      { problemId: "research-agent-web", passScore: 60, order: 2 },
      { problemId: "parallel-research-team", passScore: 62, order: 3 },
      { problemId: "coding-agent-pr", passScore: 62, order: 4 },
      { problemId: "enterprise-agent-platform", passScore: 65, order: 5 },
      { problemId: "eval-driven-agent-improvement", passScore: 65, order: 6 },
    ],
  },
];

export const SOLO_STORAGE_KEY = "sdl-solo-progress-v1";

export function getSoloLevel(id: string): SoloLevel | undefined {
  return SOLO_LEVELS.find((l) => l.id === id);
}

export function getSoloLevelProblem(
  levelId: string,
  problemId: string
): SoloLevelProblemRef | undefined {
  const level = getSoloLevel(levelId);
  return level?.problems.find((p) => p.problemId === problemId);
}

/** Level that contains this problem id (first match). */
export function getSoloLevelForProblem(problemId: string): SoloLevel | undefined {
  return SOLO_LEVELS.find((l) =>
    l.problems.some((p) => p.problemId === problemId)
  );
}

export function defaultSoloProgress(): SoloProgress {
  return {
    problems: {},
    completedLevelIds: [],
  };
}

export function isProblemCompleted(
  problemId: string,
  progress: SoloProgress
): boolean {
  return Boolean(progress.problems[problemId]);
}

export function isLevelComplete(
  level: SoloLevel,
  progress: SoloProgress
): boolean {
  if (level.problems.length === 0) return false;
  return level.problems.every((p) => isProblemCompleted(p.problemId, progress));
}

/** Completing one problem never equals completing the level. */
export function recomputeCompletedLevels(progress: SoloProgress): string[] {
  return SOLO_LEVELS.filter((level) => isLevelComplete(level, progress)).map(
    (l) => l.id
  );
}

export function isSoloLevelUnlocked(
  level: SoloLevel,
  progress: SoloProgress
): boolean {
  if (level.unlocksAfter.length === 0) return true;
  return level.unlocksAfter.every((id) =>
    progress.completedLevelIds.includes(id)
  );
}

export function starsFromScore(score: number, passScore: number): number {
  let stars = 1;
  if (score >= passScore + 15) stars = 2;
  if (score >= passScore + 25) stars = 3;
  return stars;
}

export function loadSoloProgress(): SoloProgress {
  if (typeof window === "undefined") return defaultSoloProgress();
  try {
    const raw = localStorage.getItem(SOLO_STORAGE_KEY);
    if (!raw) {
      // One-time seed from legacy map progress on this device
      return maybeSeedFromLegacyCampaignLocal();
    }
    const parsed = JSON.parse(raw) as SoloProgress;
    return normalizeSoloProgress(parsed);
  } catch {
    return defaultSoloProgress();
  }
}

/** Always writes localStorage. Server sync via push helpers. */
export function saveSoloProgress(progress: SoloProgress): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeSoloProgress(progress);
  localStorage.setItem(SOLO_STORAGE_KEY, JSON.stringify(normalized));
}

export function normalizeSoloProgress(
  progress: SoloProgress | null | undefined
): SoloProgress {
  const empty = defaultSoloProgress();
  if (!progress || typeof progress !== "object") return empty;

  const problems: Record<string, SoloProblemRecord> = {};
  const rawProblems =
    progress.problems && typeof progress.problems === "object"
      ? progress.problems
      : {};

  for (const [id, rec] of Object.entries(rawProblems)) {
    if (!rec || typeof rec !== "object") continue;
    problems[id] = {
      bestScore: typeof rec.bestScore === "number" ? rec.bestScore : 0,
      stars: typeof rec.stars === "number" ? rec.stars : 0,
      durationMs: typeof rec.durationMs === "number" ? rec.durationMs : 0,
      ...(typeof rec.completedAt === "string"
        ? { completedAt: rec.completedAt }
        : {}),
    };
  }

  const base: SoloProgress = {
    problems,
    completedLevelIds: [],
    ...(typeof progress.lastPlayedLevelId === "string"
      ? { lastPlayedLevelId: progress.lastPlayedLevelId }
      : {}),
    ...(typeof progress.lastPlayedProblemId === "string"
      ? { lastPlayedProblemId: progress.lastPlayedProblemId }
      : {}),
  };
  base.completedLevelIds = recomputeCompletedLevels(base);
  return base;
}

/**
 * Map legacy 15-level campaign map completions → Solo problem records.
 * Used for localStorage one-time seed and optional server migration.
 */
export function seedSoloFromCampaignProgress(
  campaign: CampaignProgress | null | undefined
): SoloProgress {
  const progress = defaultSoloProgress();
  if (!campaign) return progress;

  // Lazy import mapping via dynamic require of campaign level list would cycle;
  // hard-map known campaign level id → problemId (matches src/lib/campaign.ts).
  const LEVEL_TO_PROBLEM: Record<string, string> = {
    "w1-l1": "url-shortener",
    "w1-l2": "rate-limiter-service",
    "w1-l3": "distributed-kv",
    "w2-l1": "chat-system",
    "w2-l2": "global-id-generator",
    "w2-l3": "news-feed",
    "w2-l4": "ride-sharing",
    "w3-l1": "rag-support-agent",
    "w3-l2": "research-agent-web",
    "w3-l3": "parallel-research-team",
    "w4-l1": "coding-agent-pr",
    "w4-l2": "payment-system",
    "w4-l3": "video-streaming",
    "w4-l4": "enterprise-agent-platform",
    "w4-l5": "eval-driven-agent-improvement",
  };

  for (const levelId of campaign.completedLevelIds ?? []) {
    const problemId = LEVEL_TO_PROBLEM[levelId];
    if (!problemId) continue;
    const stars = Math.max(1, Math.min(3, campaign.stars?.[levelId] ?? 1));
    // Approximate bestScore from stars if unknown
    const ref = getSoloLevelForProblem(problemId);
    const pass =
      ref?.problems.find((p) => p.problemId === problemId)?.passScore ?? 60;
    const bestScore = pass + (stars - 1) * 12;
    progress.problems[problemId] = {
      bestScore,
      stars,
      durationMs: 0,
      completedAt: new Date().toISOString(),
    };
  }

  progress.completedLevelIds = recomputeCompletedLevels(progress);
  return progress;
}

function maybeSeedFromLegacyCampaignLocal(): SoloProgress {
  try {
    const raw = localStorage.getItem("sdl-campaign-progress-v1");
    if (!raw) return defaultSoloProgress();
    const campaign = JSON.parse(raw) as CampaignProgress;
    if (!campaign?.completedLevelIds?.length) return defaultSoloProgress();
    const seeded = seedSoloFromCampaignProgress(campaign);
    if (Object.keys(seeded.problems).length > 0) {
      saveSoloProgress(seeded);
    }
    return seeded;
  } catch {
    return defaultSoloProgress();
  }
}

/**
 * Record a qualifying Solo pass. durationMs kept from first finish only.
 * Updates completedLevelIds when every problem in a level is done.
 */
export function markSoloProblemComplete(
  levelId: string,
  problemId: string,
  score: number,
  passScore: number,
  durationMs: number
): SoloProgress {
  const progress = loadSoloProgress();
  const existing = progress.problems[problemId];
  const stars = starsFromScore(score, passScore);

  if (!existing) {
    progress.problems[problemId] = {
      bestScore: score,
      stars,
      durationMs: Math.max(0, Math.round(durationMs)),
      completedAt: new Date().toISOString(),
    };
  } else {
    progress.problems[problemId] = {
      ...existing,
      bestScore: Math.max(existing.bestScore, score),
      stars: Math.max(existing.stars, stars),
      // Keep first qualifying duration
      durationMs:
        existing.durationMs > 0
          ? existing.durationMs
          : Math.max(0, Math.round(durationMs)),
    };
  }

  progress.lastPlayedLevelId = levelId;
  progress.lastPlayedProblemId = problemId;
  progress.completedLevelIds = recomputeCompletedLevels(progress);
  saveSoloProgress(progress);

  void import("@/lib/progress-sync").then(({ pushSoloProgress }) => {
    pushSoloProgress(progress);
  });

  // Soft sign-in prompt after first ever Solo completion
  if (Object.keys(progress.problems).length === 1) {
    void import("@/components/auth/SignInPrompt").then(
      ({ maybeQueueSignInAfterComplete }) => {
        maybeQueueSignInAfterComplete();
      }
    );
  }

  return progress;
}

/** Deep link into Solo canvas for a problem in a level. */
export function soloProblemHref(levelId: string, problemId: string): string {
  return `/design/${problemId}?solo=${encodeURIComponent(levelId)}`;
}

/** Public summary of a level for content APIs (no progress). */
export function serializeSoloLevel(level: SoloLevel) {
  return {
    id: level.id,
    title: level.title,
    description: level.description,
    track: level.track,
    unlocksAfter: level.unlocksAfter,
    problemCount: level.problems.length,
    problems: level.problems.map((p) => {
      const problem = getProblemById(p.problemId);
      return {
        problemId: p.problemId,
        passScore: p.passScore,
        order: p.order,
        title: problem?.title ?? p.problemId,
        difficulty: problem?.difficulty ?? "medium",
        track: problem?.track ?? level.track,
        summary: problem?.summary ?? "",
      };
    }),
  };
}

export function levelProgressSummary(level: SoloLevel, progress: SoloProgress) {
  const total = level.problems.length;
  const completed = level.problems.filter((p) =>
    isProblemCompleted(p.problemId, progress)
  ).length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    complete: completed === total && total > 0,
    unlocked: isSoloLevelUnlocked(level, progress),
  };
}
