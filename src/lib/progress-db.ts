import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignProgress } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";
import {
  isCampaignEmpty,
  isTrainingEmpty,
  mergeCampaignProgress,
  mergeTrainingProgress,
} from "@/lib/progress-merge";

type CampaignRow = {
  user_id: string;
  completed_level_ids: string[] | null;
  stars: Record<string, number> | null;
  wrenches_survived: number | null;
  last_played_level_id: string | null;
  updated_at?: string;
};

type TrainingRow = {
  user_id: string;
  completed_lesson_ids: string[] | null;
  last_lesson_id: string | null;
  updated_at?: string;
};

export function rowToCampaign(row: CampaignRow | null): CampaignProgress | null {
  if (!row) return null;
  return {
    completedLevelIds: row.completed_level_ids ?? [],
    stars: (row.stars as Record<string, number>) ?? {},
    wrenchesSurvived: row.wrenches_survived ?? 0,
    ...(row.last_played_level_id
      ? { lastPlayedLevelId: row.last_played_level_id }
      : {}),
  };
}

export function rowToTraining(row: TrainingRow | null): TrainingProgress | null {
  if (!row) return null;
  return {
    completedLessonIds: row.completed_lesson_ids ?? [],
    ...(row.last_lesson_id ? { lastLessonId: row.last_lesson_id } : {}),
  };
}

export function campaignToRow(userId: string, p: CampaignProgress) {
  return {
    user_id: userId,
    completed_level_ids: p.completedLevelIds ?? [],
    stars: p.stars ?? {},
    wrenches_survived: p.wrenchesSurvived ?? 0,
    last_played_level_id: p.lastPlayedLevelId ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function trainingToRow(userId: string, p: TrainingProgress) {
  return {
    user_id: userId,
    completed_lesson_ids: p.completedLessonIds ?? [],
    last_lesson_id: p.lastLessonId ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCampaignProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<CampaignProgress | null> {
  const { data, error } = await supabase
    .from("campaign_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return rowToCampaign(data as CampaignRow | null);
}

export async function fetchTrainingProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<TrainingProgress | null> {
  const { data, error } = await supabase
    .from("training_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return rowToTraining(data as TrainingRow | null);
}

export async function upsertCampaignProgress(
  supabase: SupabaseClient,
  user: User,
  progress: CampaignProgress
): Promise<CampaignProgress> {
  // Never wipe remote with empty local payload
  if (isCampaignEmpty(progress)) {
    const remote = await fetchCampaignProgress(supabase, user.id);
    if (remote && !isCampaignEmpty(remote)) return remote;
  }

  const { data, error } = await supabase
    .from("campaign_progress")
    .upsert(campaignToRow(user.id, progress), { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return rowToCampaign(data as CampaignRow)!;
}

export async function upsertTrainingProgress(
  supabase: SupabaseClient,
  user: User,
  progress: TrainingProgress
): Promise<TrainingProgress> {
  if (isTrainingEmpty(progress)) {
    const remote = await fetchTrainingProgress(supabase, user.id);
    if (remote && !isTrainingEmpty(remote)) return remote;
  }

  const { data, error } = await supabase
    .from("training_progress")
    .upsert(trainingToRow(user.id, progress), { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return rowToTraining(data as TrainingRow)!;
}

export async function mergeAndPersist(
  supabase: SupabaseClient,
  user: User,
  localCampaign: CampaignProgress | null | undefined,
  localTraining: TrainingProgress | null | undefined
): Promise<{
  campaign: CampaignProgress;
  training: TrainingProgress;
  mergedFromLocal: boolean;
}> {
  const remoteCampaign = await fetchCampaignProgress(supabase, user.id);
  const remoteTraining = await fetchTrainingProgress(supabase, user.id);

  const hadLocal =
    !isCampaignEmpty(localCampaign) || !isTrainingEmpty(localTraining);

  const campaign = mergeCampaignProgress(localCampaign, remoteCampaign);
  const training = mergeTrainingProgress(localTraining, remoteTraining);

  // Persist merged result (source of truth for signed-in users)
  const { error: cErr } = await supabase
    .from("campaign_progress")
    .upsert(campaignToRow(user.id, campaign), { onConflict: "user_id" });
  if (cErr) throw cErr;

  const { error: tErr } = await supabase
    .from("training_progress")
    .upsert(trainingToRow(user.id, training), { onConflict: "user_id" });
  if (tErr) throw tErr;

  return {
    campaign,
    training,
    mergedFromLocal: hadLocal && Boolean(remoteCampaign || remoteTraining),
  };
}
