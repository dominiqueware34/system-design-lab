"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Loader2,
  Lock,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from "lucide-react";
import {
  SEASON_PROMPT_TARGET,
  fetchCurrentSeasonContext,
  fetchMySeason,
  fetchSeasonPrompts,
  formatCountdown,
  formatDurationMs,
  maxAttemptsFromRules,
  problemFromPromptPayload,
  type CampaignPromptClient,
  type CampaignSeasonPublic,
  type MeAttempt,
  type MeScore,
  type MeSession,
} from "@/lib/campaign-client";

type HubState =
  | { status: "loading" }
  | { status: "empty"; message?: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      season: CampaignSeasonPublic;
      prompts: CampaignPromptClient[];
      score: MeScore | null;
      attempts: MeAttempt[];
      sessions: MeSession[];
      promptCount: number;
      /** Post-season: play frozen; references may be present on prompts. */
      ended: boolean;
    };

function DiffBadge({ difficulty }: { difficulty: string }) {
  const cls =
    difficulty === "hard"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : difficulty === "easy"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        : "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${cls}`}
    >
      {difficulty}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= n ? "fill-amber-400 text-amber-400" : "text-zinc-700"
          }`}
        />
      ))}
    </span>
  );
}

export function CampaignHub() {
  const [state, setState] = useState<HubState>({ status: "loading" });
  const [nowTick, setNowTick] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { season, endedSeason } = await fetchCurrentSeasonContext();
      const active = season ?? endedSeason;
      if (!active) {
        setState({
          status: "empty",
          message:
            "No live season right now. Check back when the next 3-day window opens.",
        });
        return;
      }

      const ended =
        !season && !!endedSeason
          ? true
          : active.status === "ended" || active.openForPlay === false;

      if (!ended && active.status !== "live") {
        setState({
          status: "empty",
          message: `Season “${active.title}” is ${active.status}. Play opens when status is live.`,
        });
        return;
      }

      const [promptsRes, meRes] = await Promise.all([
        fetchSeasonPrompts(active.id),
        fetchMySeason(active.id).catch(() => null),
      ]);

      setState({
        status: "ready",
        season: promptsRes.season,
        prompts: promptsRes.prompts,
        score: meRes?.score ?? null,
        attempts: meRes?.attempts ?? [],
        sessions: meRes?.sessions ?? [],
        promptCount: meRes?.promptCount ?? promptsRes.prompts.length,
        ended,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load season",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  const attemptMap = useMemo(() => {
    if (state.status !== "ready") return new Map<string, MeAttempt[]>();
    const m = new Map<string, MeAttempt[]>();
    for (const a of state.attempts) {
      const list = m.get(a.promptId) ?? [];
      list.push(a);
      m.set(a.promptId, list);
    }
    return m;
  }, [state]);

  const sessionMap = useMemo(() => {
    if (state.status !== "ready") return new Map<string, string>();
    return new Map(state.sessions.map((s) => [s.promptId, s.startedAt]));
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading season…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6">
        <p className="text-sm font-medium text-rose-200">Could not load season</p>
        <p className="mt-2 text-sm text-rose-200/80">{state.message}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium text-zinc-100">No live Campaign season</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {state.message}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/solo"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
          >
            Play Solo Mode
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
          >
            Free practice
          </Link>
        </div>
      </div>
    );
  }

  const { season, prompts, score, promptCount, ended } = state;
  const maxAttempts = maxAttemptsFromRules(season.rules, 3);
  const scored = score?.promptsScored ?? 0;
  const target = promptCount || SEASON_PROMPT_TARGET;
  const countdown = formatCountdown(season.endsAt);
  void nowTick;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className={`text-[11px] font-medium uppercase tracking-wide ${
              ended ? "text-zinc-400" : "text-rose-300/80"
            }`}
          >
            {ended ? "Season ended · references unlocked" : "Live season"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{season.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            <code className="text-zinc-400">{season.slug}</code>
            {" · "}
            formula{" "}
            <code className="text-zinc-400">
              {(season.rules?.score_formula as string) ?? "v1_correct_diff_cover"}
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/campaign/leaderboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link
            href="/campaign/stats"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5"
          >
            <Clock className="h-4 w-4" />
            My stats
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
            <Timer className="h-3.5 w-3.5 text-rose-400" />
            Season ends
          </div>
          <p className="text-lg font-semibold tabular-nums text-zinc-50">
            {countdown}
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Sticky per-prompt timer is private — not on the public board.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Coverage
          </div>
          <p className="text-lg font-semibold tabular-nums text-zinc-50">
            {scored}/{target}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-rose-500 transition-all"
              style={{
                width: `${Math.min(100, Math.round((scored / Math.max(1, target)) * 100))}%`,
              }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            Your season score
          </div>
          <p className="text-lg font-semibold tabular-nums text-zinc-50">
            {score ? Math.round(score.seasonScore) : "—"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            {score
              ? `${score.totalStars}★ total · best attempt per prompt`
              : "Submit a design to appear on the board"}
          </p>
        </div>
      </div>

      {ended ? (
        <p className="mb-3 rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
          Competitive play is frozen. Reference designs are revealed below when
          the API unlocks them after season end.
        </p>
      ) : null}

      <h3 className="mb-3 text-sm font-semibold text-zinc-200">
        Season prompts ({prompts.length})
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {prompts
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => {
            const problem = problemFromPromptPayload(p.problem);
            const title = problem?.title ?? p.promptKey;
            const attempts = attemptMap.get(p.id) ?? [];
            const used = attempts.length;
            const bestStars = attempts.reduce(
              (m, a) => Math.max(m, a.stars ?? 0),
              0
            );
            const exhausted = used >= maxAttempts;
            const playLocked = ended || exhausted;
            const startedAt = sessionMap.get(p.id);
            const bestDuration = attempts
              .map((a) => a.durationMs)
              .filter((d): d is number => d != null && d >= 0)
              .sort((a, b) => a - b)[0];
            const hasReference =
              p.referenceDesign != null && p.referenceDesign !== undefined;

            return (
              <li key={p.id}>
                <div
                  className={`rounded-xl border px-3 py-3 ${
                    playLocked
                      ? "border-white/5 bg-zinc-950/40"
                      : "border-white/10 bg-zinc-950/40 hover:border-rose-500/40 hover:bg-zinc-900/60"
                  }`}
                >
                  {playLocked ? (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Lock className="h-4 w-4 shrink-0 text-zinc-600" />
                          <span className="truncate text-sm font-medium text-zinc-100">
                            {title}
                          </span>
                          <DiffBadge difficulty={p.difficulty} />
                        </div>
                        <p className="mt-1 pl-6 text-[11px] text-zinc-600">
                          {ended
                            ? hasReference
                              ? "Reference design unlocked"
                              : "Season ended · reference pending"
                            : `${used}/${maxAttempts} attempts`}
                          {!ended && startedAt ? " · timer running" : ""}
                        </p>
                        {ended && hasReference ? (
                          <p className="mt-2 pl-6 text-[11px] text-emerald-400/90">
                            Reference design included in API response (study
                            mode).
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-zinc-500">
                        {bestStars > 0 ? <Stars n={bestStars} /> : null}
                        <span className="text-zinc-600">
                          {ended ? "Frozen" : "Max attempts"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/campaign/play/${p.id}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Sparkles className="h-4 w-4 shrink-0 text-rose-400" />
                          <span className="truncate text-sm font-medium text-zinc-100">
                            {title}
                          </span>
                          <DiffBadge difficulty={p.difficulty} />
                        </div>
                        <p className="mt-1 pl-6 text-[11px] text-zinc-600">
                          {used}/{maxAttempts} attempts
                          {startedAt ? " · timer running" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-zinc-500">
                        {bestStars > 0 ? <Stars n={bestStars} /> : null}
                        {bestDuration != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDurationMs(bestDuration)}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-0.5 text-rose-300">
                          Play
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
