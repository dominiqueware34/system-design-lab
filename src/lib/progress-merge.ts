import type { CampaignProgress, SoloProblemRecord, SoloProgress } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";
import { recomputeCompletedLevels } from "@/lib/solo-levels";

/** Union completed ids; max stars per level; max wrenches; never wipe remote with empty local. */
export function mergeCampaignProgress(
  local: CampaignProgress | null | undefined,
  remote: CampaignProgress | null | undefined
): CampaignProgress {
  const empty: CampaignProgress = {
    completedLevelIds: [],
    stars: {},
    wrenchesSurvived: 0,
  };
  const a = local ?? empty;
  const b = remote ?? empty;

  const completedLevelIds = [
    ...new Set([...(a.completedLevelIds ?? []), ...(b.completedLevelIds ?? [])]),
  ];

  const stars: Record<string, number> = { ...(b.stars ?? {}) };
  for (const [id, s] of Object.entries(a.stars ?? {})) {
    stars[id] = Math.max(stars[id] ?? 0, s ?? 0);
  }

  const wrenchesSurvived = Math.max(
    a.wrenchesSurvived ?? 0,
    b.wrenchesSurvived ?? 0
  );

  const lastPlayedLevelId =
    a.lastPlayedLevelId ?? b.lastPlayedLevelId ?? undefined;

  return {
    completedLevelIds,
    stars,
    wrenchesSurvived,
    ...(lastPlayedLevelId ? { lastPlayedLevelId } : {}),
  };
}

export function mergeTrainingProgress(
  local: TrainingProgress | null | undefined,
  remote: TrainingProgress | null | undefined
): TrainingProgress {
  const a = local ?? { completedLessonIds: [] };
  const b = remote ?? { completedLessonIds: [] };

  const completedLessonIds = [
    ...new Set([
      ...(a.completedLessonIds ?? []),
      ...(b.completedLessonIds ?? []),
    ]),
  ];

  const lastLessonId = a.lastLessonId ?? b.lastLessonId;

  return {
    completedLessonIds,
    ...(lastLessonId ? { lastLessonId } : {}),
  };
}

export function isCampaignEmpty(p: CampaignProgress | null | undefined): boolean {
  if (!p) return true;
  return (
    (p.completedLevelIds?.length ?? 0) === 0 &&
    Object.keys(p.stars ?? {}).length === 0 &&
    (p.wrenchesSurvived ?? 0) === 0
  );
}

export function isTrainingEmpty(p: TrainingProgress | null | undefined): boolean {
  if (!p) return true;
  return (p.completedLessonIds?.length ?? 0) === 0;
}

/** Union problems (max score/stars; keep first non-zero durationMs); recompute level completions. */
export function mergeSoloProgress(
  local: SoloProgress | null | undefined,
  remote: SoloProgress | null | undefined
): SoloProgress {
  const empty: SoloProgress = { problems: {}, completedLevelIds: [] };
  const a = local ?? empty;
  const b = remote ?? empty;

  const problemIds = new Set([
    ...Object.keys(a.problems ?? {}),
    ...Object.keys(b.problems ?? {}),
  ]);

  const problems: Record<string, SoloProblemRecord> = {};
  for (const id of problemIds) {
    const la = a.problems?.[id];
    const rb = b.problems?.[id];
    if (!la && !rb) continue;
    if (la && !rb) {
      problems[id] = { ...la };
      continue;
    }
    if (!la && rb) {
      problems[id] = { ...rb };
      continue;
    }
    // both
    const durationMs =
      la!.durationMs > 0 && rb!.durationMs > 0
        ? Math.min(la!.durationMs, rb!.durationMs)
        : Math.max(la!.durationMs, rb!.durationMs);
    const completedAt =
      la!.completedAt && rb!.completedAt
        ? la!.completedAt < rb!.completedAt
          ? la!.completedAt
          : rb!.completedAt
        : la!.completedAt ?? rb!.completedAt;
    problems[id] = {
      bestScore: Math.max(la!.bestScore ?? 0, rb!.bestScore ?? 0),
      stars: Math.max(la!.stars ?? 0, rb!.stars ?? 0),
      durationMs,
      ...(completedAt ? { completedAt } : {}),
    };
  }

  const merged: SoloProgress = {
    problems,
    completedLevelIds: [],
    lastPlayedLevelId:
      a.lastPlayedLevelId ?? b.lastPlayedLevelId ?? undefined,
    lastPlayedProblemId:
      a.lastPlayedProblemId ?? b.lastPlayedProblemId ?? undefined,
  };
  merged.completedLevelIds = recomputeCompletedLevels(merged);
  return merged;
}

export function isSoloEmpty(p: SoloProgress | null | undefined): boolean {
  if (!p) return true;
  return Object.keys(p.problems ?? {}).length === 0;
}
