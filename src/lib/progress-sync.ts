import type { CampaignProgress, SoloProgress } from "@/lib/types";
import type { TrainingProgress } from "@/lib/training-lessons";
import {
  defaultProgress,
  loadProgress,
  saveProgress,
} from "@/lib/campaign";
import {
  defaultTrainingProgress,
  loadTrainingProgress,
  saveTrainingProgress,
} from "@/lib/training-lessons";
import {
  defaultSoloProgress,
  loadSoloProgress,
  saveSoloProgress,
} from "@/lib/solo-levels";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type MergeResult = {
  campaign: CampaignProgress;
  training: TrainingProgress;
  solo: SoloProgress;
  mergedFromLocal: boolean;
};

let mergeInFlight: Promise<MergeResult | null> | null = null;

/** Whether the browser currently has a Supabase session (no throw if unconfigured). */
export async function isSignedIn(): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

/**
 * On login: POST local campaign + training + solo to /api/progress/merge,
 * hydrate localStorage from the server response.
 */
export async function mergeLocalWithServer(): Promise<MergeResult | null> {
  if (!hasSupabaseEnv() || typeof window === "undefined") return null;

  if (mergeInFlight) return mergeInFlight;

  mergeInFlight = (async () => {
    try {
      const campaign = loadProgress();
      const training = loadTrainingProgress();
      const solo = loadSoloProgress();

      const res = await fetch("/api/progress/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, training, solo }),
      });

      if (res.status === 401) return null;
      if (!res.ok) {
        console.error("[progress-sync] merge failed", await res.text());
        return null;
      }

      const data = (await res.json()) as MergeResult;
      saveProgress(data.campaign ?? defaultProgress());
      saveTrainingProgress(data.training ?? defaultTrainingProgress());
      saveSoloProgress(data.solo ?? defaultSoloProgress());
      window.dispatchEvent(new CustomEvent("sdl:progress-synced", { detail: data }));
      return data;
    } catch (err) {
      console.error("[progress-sync] merge error", err);
      return null;
    } finally {
      mergeInFlight = null;
    }
  })();

  return mergeInFlight;
}

/** Fire-and-forget PUT campaign progress when signed in. Keeps localStorage always. */
export function pushCampaignProgress(progress: CampaignProgress): void {
  if (typeof window === "undefined" || !hasSupabaseEnv()) return;
  void (async () => {
    try {
      const signedIn = await isSignedIn();
      if (!signedIn) return;
      const res = await fetch("/api/progress/campaign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      if (!res.ok && res.status !== 401) {
        console.error("[progress-sync] campaign PUT failed", await res.text());
      }
    } catch (err) {
      console.error("[progress-sync] campaign PUT error", err);
    }
  })();
}

/** Fire-and-forget PUT training progress when signed in. */
export function pushTrainingProgress(progress: TrainingProgress): void {
  if (typeof window === "undefined" || !hasSupabaseEnv()) return;
  void (async () => {
    try {
      const signedIn = await isSignedIn();
      if (!signedIn) return;
      const res = await fetch("/api/progress/training", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      if (!res.ok && res.status !== 401) {
        console.error("[progress-sync] training PUT failed", await res.text());
      }
    } catch (err) {
      console.error("[progress-sync] training PUT error", err);
    }
  })();
}

/** Fire-and-forget PUT Solo Mode progress when signed in. */
export function pushSoloProgress(progress: SoloProgress): void {
  if (typeof window === "undefined" || !hasSupabaseEnv()) return;
  void (async () => {
    try {
      const signedIn = await isSignedIn();
      if (!signedIn) return;
      const res = await fetch("/api/progress/solo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      if (!res.ok && res.status !== 401) {
        console.error("[progress-sync] solo PUT failed", await res.text());
      }
    } catch (err) {
      console.error("[progress-sync] solo PUT error", err);
    }
  })();
}
