"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import {
  SOLO_LEVELS,
  isProblemCompleted,
  isSoloLevelUnlocked,
  levelProgressSummary,
  loadSoloProgress,
  soloProblemHref,
} from "@/lib/solo-levels";
import type { SoloLevel, SoloProgress } from "@/lib/types";
import { getProblemById, TRACK_META } from "@/lib/problems";

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} stars`}>
      {[1, 2, 3].map((i) => (
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

export function SoloHub() {
  const [progress, setProgress] = useState<SoloProgress | null>(null);

  const refresh = useCallback(() => {
    setProgress(loadSoloProgress());
  }, []);

  useEffect(() => {
    refresh();
    const onSync = () => refresh();
    window.addEventListener("sdl:progress-synced", onSync);
    window.addEventListener("storage", onSync);
    return () => {
      window.removeEventListener("sdl:progress-synced", onSync);
      window.removeEventListener("storage", onSync);
    };
  }, [refresh]);

  const p = progress ?? { problems: {}, completedLevelIds: [] };

  const totalProblems = SOLO_LEVELS.reduce((n, l) => n + l.problems.length, 0);
  const completedProblems = Object.keys(p.problems).length;
  const levelsDone = p.completedLevelIds.length;

  return (
    <div>
      <header className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <Trophy className="h-3.5 w-3.5" />
          Solo Mode
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Personal multi-problem levels
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Clear every problem in a level to unlock the next. No wrenches, no
          public ranking — just your best score, stars, and time per problem.
          Completing one problem does not complete the level.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-zinc-500">
          <span className="rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-1.5">
            Problems{" "}
            <strong className="text-zinc-200">
              {completedProblems}/{totalProblems}
            </strong>
          </span>
          <span className="rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-1.5">
            Levels{" "}
            <strong className="text-zinc-200">
              {levelsDone}/{SOLO_LEVELS.length}
            </strong>
          </span>
          <span className="rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-1.5">
            Progress in{" "}
            <code className="text-zinc-400">sdl-solo-progress-v1</code>
          </span>
        </div>
      </header>

      <div className="space-y-8">
        {SOLO_LEVELS.map((level, idx) => (
          <LevelCard
            key={level.id}
            level={level}
            index={idx + 1}
            progress={p}
          />
        ))}
      </div>
    </div>
  );
}

function LevelCard({
  level,
  index,
  progress,
}: {
  level: SoloLevel;
  index: number;
  progress: SoloProgress;
}) {
  const unlocked = isSoloLevelUnlocked(level, progress);
  const summary = levelProgressSummary(level, progress);
  const track = TRACK_META[level.track];

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        unlocked
          ? "border-white/10 bg-zinc-900/40"
          : "border-white/5 bg-zinc-950/60 opacity-80"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Level {index}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${track.badge}`}
            >
              {track.label}
            </span>
            {summary.complete ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </span>
            ) : null}
            {!unlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-600/40 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                <Lock className="h-3 w-3" />
                Locked — finish Level {index - 1} first
              </span>
            ) : null}
          </div>
          <h2 className="text-xl font-semibold text-zinc-50">{level.title}</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">{level.description}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium text-zinc-200">
            {summary.completed}/{summary.total} problems
          </p>
          <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${summary.percent}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {level.problems
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((slot) => {
            const done = isProblemCompleted(slot.problemId, progress);
            const rec = progress.problems[slot.problemId];
            const title =
              getProblemById(slot.problemId)?.title ?? slot.problemId;

            const inner = (
              <div
                className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-3 transition ${
                  !unlocked
                    ? "cursor-not-allowed border-white/5 bg-zinc-950/40"
                    : done
                      ? "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40"
                      : "border-white/10 bg-zinc-950/40 hover:border-violet-500/40 hover:bg-zinc-900/60"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : !unlocked ? (
                      <Lock className="h-4 w-4 shrink-0 text-zinc-600" />
                    ) : (
                      <Sparkles className="h-4 w-4 shrink-0 text-violet-400" />
                    )}
                    <span
                      className={`truncate text-sm font-medium ${
                        unlocked ? "text-zinc-100" : "text-zinc-500"
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                  <p className="mt-1 pl-6 text-[11px] text-zinc-600">
                    Pass ≥ {slot.passScore}
                    {rec ? (
                      <>
                        {" · "}
                        best {rec.bestScore}
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-zinc-500">
                  {rec ? <Stars n={rec.stars} /> : null}
                  {rec && rec.durationMs > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(rec.durationMs)}
                    </span>
                  ) : null}
                </div>
              </div>
            );

            if (!unlocked) {
              return <li key={slot.problemId}>{inner}</li>;
            }

            return (
              <li key={slot.problemId}>
                <Link href={soloProblemHref(level.id, slot.problemId)}>
                  {inner}
                </Link>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
