"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { DesignWorkspace } from "@/components/canvas/DesignWorkspace";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  fetchMySeason,
  fetchSeasonPrompts,
  maxAttemptsFromRules,
  problemFromPromptPayload,
  startPromptSession,
  type CampaignPromptClient,
  type CampaignSeasonPublic,
} from "@/lib/campaign-client";
import type { DesignProblem } from "@/lib/types";

type LoadState =
  | { status: "auth" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      problem: DesignProblem;
      season: CampaignSeasonPublic;
      prompt: CampaignPromptClient;
      startedAt: string;
      attemptsUsed: number;
      maxAttempts: number;
    };

/**
 * Competitive campaign play shell.
 * Auth required (guest redirect). Starts sticky session then mounts DesignWorkspace mode=campaign.
 */
export function CampaignPlayClient({ promptId }: { promptId: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "auth" });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!hasSupabaseEnv()) {
        setState({
          status: "error",
          message:
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        });
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setState({ status: "error", message: "Auth client unavailable." });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        router.replace(
          `/campaign?signin=1&next=${encodeURIComponent(`/campaign/play/${promptId}`)}`
        );
        return;
      }

      setState({ status: "loading" });

      try {
        // Sticky timer starts on first open; resubmit does not reset.
        const session = await startPromptSession(promptId);

        // Resolve prompt + attempt counts from season APIs (no reference_design).
        const promptsRes = await fetchSeasonPrompts(session.seasonId);
        const prompt = promptsRes.prompts.find((p) => p.id === promptId);
        if (!prompt) {
          throw new Error("Prompt not found in this season");
        }

        const problem = problemFromPromptPayload(prompt.problem);
        if (!problem) {
          throw new Error("Prompt problem payload is invalid");
        }

        let attemptsUsed = 0;
        try {
          const me = await fetchMySeason(session.seasonId);
          attemptsUsed = me.attempts.filter((a) => a.promptId === promptId)
            .length;
        } catch {
          // me is best-effort; start already authorized us
        }

        const maxAttempts = maxAttemptsFromRules(promptsRes.season.rules, 3);

        if (cancelled) return;
        setState({
          status: "ready",
          problem,
          season: promptsRes.season,
          prompt,
          startedAt: session.startedAt,
          attemptsUsed,
          maxAttempts,
        });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to start campaign play";
        if (msg === "Unauthorized") {
          router.replace(
            `/campaign?signin=1&next=${encodeURIComponent(`/campaign/play/${promptId}`)}`
          );
          return;
        }
        setState({ status: "error", message: msg });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [promptId, router]);

  // Soft re-check: if session drops mid-play, leave play route.
  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      const u: User | null = session?.user ?? null;
      if (!u) {
        router.replace("/campaign?signin=1");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (state.status === "auth" || state.status === "loading") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
        <p className="text-sm">
          {state.status === "auth" ? "Checking sign-in…" : "Starting session…"}
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
        <p className="text-sm font-medium text-rose-200">{state.message}</p>
        <Link
          href="/campaign"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          Back to Campaign
        </Link>
      </div>
    );
  }

  return (
    <DesignWorkspace
      problem={state.problem}
      mode="campaign"
      seasonPromptId={state.prompt.id}
      campaignPlay={{
        seasonId: state.season.id,
        startedAt: state.startedAt,
        attemptsUsed: state.attemptsUsed,
        maxAttempts: state.maxAttempts,
        difficulty: state.prompt.difficulty,
      }}
    />
  );
}
