import type { CampaignProgress } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";

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
