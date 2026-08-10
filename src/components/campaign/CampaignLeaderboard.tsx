"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import {
  fetchCurrentSeason,
  fetchLeaderboard,
  type CampaignSeasonPublic,
  type LeaderboardEntry,
} from "@/lib/campaign-client";

type State =
  | { status: "loading" }
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      season: CampaignSeasonPublic;
      leaderboard: LeaderboardEntry[];
    };

/**
 * Public season leaderboard.
 * Columns: rank, name, season_score, stars, prompts — NO time column.
 */
export function CampaignLeaderboard() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const season = await fetchCurrentSeason();
      if (!season) {
        setState({
          status: "empty",
          message: "No live season — leaderboard will appear when a season is live.",
        });
        return;
      }
      const data = await fetchLeaderboard(season.id, 100);
      setState({
        status: "ready",
        season: data.season,
        leaderboard: data.leaderboard,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load leaderboard",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.10),_transparent_50%)]" />
      <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-10">
        <Link
          href="/campaign"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Campaign hub
        </Link>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard · no times
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Season rankings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Ranked by{" "}
          <code className="text-zinc-300">season_score</code> (
          <code className="text-zinc-300">v1_correct_diff_cover</code>). Private
          sticky timers never appear here.
        </p>

        <div className="mt-8">
          {state.status === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading leaderboard…
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
              {state.message}
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 block text-xs underline"
              >
                Retry
              </button>
            </div>
          ) : null}

          {state.status === "empty" ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
              {state.message}
            </div>
          ) : null}

          {state.status === "ready" ? (
            <>
              <p className="mb-3 text-xs text-zinc-500">
                {state.season.title}
                {state.season.status !== "live"
                  ? ` · ${state.season.status}`
                  : ""}
              </p>
              {state.leaderboard.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
                  No scores yet. Be the first to submit a campaign design.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 bg-zinc-900/80 text-[11px] uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">Rank</th>
                        <th className="px-3 py-2.5 font-medium">Name</th>
                        <th className="px-3 py-2.5 font-medium tabular-nums">
                          Score
                        </th>
                        <th className="px-3 py-2.5 font-medium tabular-nums">
                          Stars
                        </th>
                        <th className="px-3 py-2.5 font-medium tabular-nums">
                          Prompts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.leaderboard.map((row) => (
                        <tr
                          key={row.userId}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                        >
                          <td className="px-3 py-2.5 tabular-nums text-zinc-400">
                            {row.rank}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-zinc-100">
                            {row.displayName?.trim() || "Player"}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-zinc-200">
                            {Math.round(row.seasonScore)}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-amber-300/90">
                            {row.totalStars}★
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-zinc-400">
                            {row.promptsScored}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Explicit invariant: no duration / time columns in this table. */}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
