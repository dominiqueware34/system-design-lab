"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Loader2, Star } from "lucide-react";
import {
  fetchCurrentSeason,
  fetchMySeason,
  fetchSeasonPrompts,
  formatDurationMs,
  problemFromPromptPayload,
  type CampaignPromptClient,
  type CampaignSeasonPublic,
  type MeAttempt,
  type MeScore,
  type MeSession,
} from "@/lib/campaign-client";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; message: string }
  | {
      status: "ready";
      season: CampaignSeasonPublic;
      prompts: CampaignPromptClient[];
      score: MeScore | null;
      attempts: MeAttempt[];
      sessions: MeSession[];
    };

/**
 * Owner-only view: private duration_ms per prompt (from /me).
 * Not shown on public leaderboard.
 */
export function CampaignMyStats() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const season = await fetchCurrentSeason();
      if (!season) {
        setState({
          status: "empty",
          message: "No live season — stats appear when a season is open.",
        });
        return;
      }
      const [me, promptsRes] = await Promise.all([
        fetchMySeason(season.id),
        fetchSeasonPrompts(season.id),
      ]);
      setState({
        status: "ready",
        season: me.season,
        prompts: promptsRes.prompts,
        score: me.score,
        attempts: me.attempts,
        sessions: me.sessions,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      setState({
        status: "error",
        message:
          msg === "Unauthorized"
            ? "Sign in to view your private campaign times."
            : msg,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byPrompt = useMemo(() => {
    if (state.status !== "ready") return new Map<string, MeAttempt[]>();
    const m = new Map<string, MeAttempt[]>();
    for (const a of state.attempts) {
      const list = m.get(a.promptId) ?? [];
      list.push(a);
      m.set(a.promptId, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.attemptNumber - b.attemptNumber);
    }
    return m;
  }, [state]);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.08),_transparent_50%)]" />
      <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-10">
        <Link
          href="/campaign"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Campaign hub
        </Link>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
          <Clock className="h-3.5 w-3.5" />
          My stats · private times
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Your campaign times
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Sticky timer durations are private to you. They never appear on the public
          leaderboard and are not part of{" "}
          <code className="text-zinc-300">season_score</code>.
        </p>

        <div className="mt-8">
          {state.status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your stats…
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
              {state.message}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => void load()}
                  className="text-xs underline"
                >
                  Retry
                </button>
                <Link href="/campaign" className="text-xs underline">
                  Back to hub
                </Link>
              </div>
            </div>
          ) : null}

          {state.status === "empty" ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
              {state.message}
            </div>
          ) : null}

          {state.status === "ready" ? (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Season score
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {state.score
                      ? Math.round(state.score.seasonScore)
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Total stars
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-amber-300">
                    {state.score ? `${state.score.totalStars}★` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    Prompts scored
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {state.score?.promptsScored ?? 0}/{state.prompts.length}
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {state.prompts
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((p) => {
                    const problem = problemFromPromptPayload(p.problem);
                    const title = problem?.title ?? p.promptKey;
                    const attempts = byPrompt.get(p.id) ?? [];
                    const session = state.sessions.find(
                      (s) => s.promptId === p.id
                    );
                    return (
                      <li
                        key={p.id}
                        className="rounded-xl border border-white/10 bg-zinc-900/40 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {title}
                            </p>
                            <p className="mt-0.5 text-[11px] capitalize text-zinc-500">
                              {p.difficulty} · {p.track}
                            </p>
                          </div>
                          {session ? (
                            <span className="text-[11px] text-zinc-600">
                              Started{" "}
                              {new Date(session.startedAt).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-600">
                              Not started
                            </span>
                          )}
                        </div>
                        {attempts.length === 0 ? (
                          <p className="mt-3 text-xs text-zinc-600">
                            No attempts yet.
                          </p>
                        ) : (
                          <ul className="mt-3 space-y-1.5">
                            {attempts.map((a) => (
                              <li
                                key={a.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-zinc-950/50 px-3 py-2 text-xs"
                              >
                                <span className="text-zinc-400">
                                  Attempt {a.attemptNumber}
                                </span>
                                <span className="inline-flex items-center gap-2 text-zinc-300">
                                  {a.stars != null ? (
                                    <span className="inline-flex items-center gap-0.5 text-amber-300">
                                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                      {a.stars}
                                    </span>
                                  ) : null}
                                  {a.aiScore != null ? (
                                    <span className="tabular-nums text-zinc-500">
                                      score {a.aiScore}
                                    </span>
                                  ) : null}
                                  <span className="inline-flex items-center gap-1 tabular-nums text-zinc-200">
                                    <Clock className="h-3 w-3 text-zinc-500" />
                                    {formatDurationMs(a.durationMs)}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
