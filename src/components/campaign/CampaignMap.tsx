"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_PATHS,
  campaignHref,
  isLevelCompleted,
  isLevelUnlocked,
  loadProgress,
  worlds,
} from "@/lib/campaign";
import type { CampaignLevelNode, CampaignProgress } from "@/lib/types";
import { getProblemById } from "@/lib/problems";
import { Lock, Map as MapIcon, Star, Swords, Trophy } from "lucide-react";
import { SoftSignInHint } from "@/components/auth/SignInPrompt";

function nodeById(id: string): CampaignLevelNode | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

const WORLD_COLORS: Record<number, string> = {
  1: "#34d399",
  2: "#38bdf8",
  3: "#c084fc",
  4: "#f472b6",
};

export function CampaignMap() {
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [selected, setSelected] = useState<CampaignLevelNode | null>(null);

  const refresh = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    setProgress(loadProgress());
    const onSync = () => setProgress(loadProgress());
    window.addEventListener("sdl:progress-synced", onSync);
    return () => window.removeEventListener("sdl:progress-synced", onSync);
  }, []);

  const completed = progress?.completedLevelIds.length ?? 0;
  const total = CAMPAIGN_LEVELS.length;
  const stars = Object.values(progress?.stars ?? {}).reduce((a, b) => a + b, 0);

  const pathLines = useMemo(() => {
    return CAMPAIGN_PATHS.map(({ from, to }) => {
      const a = nodeById(from);
      const b = nodeById(to);
      if (!a || !b) return null;
      return { from: a, to: b, key: `${from}-${to}` };
    }).filter(Boolean) as Array<{
      from: CampaignLevelNode;
      to: CampaignLevelNode;
      key: string;
    }>;
  }, []);

  if (!progress) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-zinc-500">
        Loading map…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <MapIcon className="h-3.5 w-3.5" />
            Solo Mode
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The Architecture Trail
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Personal progression — no public ranking. Clear levels along the path. Each
            stage, the AI inspects your design and throws a{" "}
            <span className="text-zinc-200">wrench</span> — latency spikes, security holes,
            DB overflows, agent failures — fix it to unlock the next node. (Temporary 15×1
            map until multi-problem Solo levels ship.)
          </p>
          <SoftSignInHint className="mt-3 max-w-xl" />
        </div>
        <div className="flex gap-3 text-sm">
          <Stat icon={Trophy} label="Cleared" value={`${completed}/${total}`} />
          <Stat icon={Star} label="Stars" value={String(stars)} />
          <Stat
            icon={Swords}
            label="Wrenches"
            value={String(progress.wrenchesSurvived)}
          />
        </div>
      </header>

      {/* World legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {worlds().map((w) => (
          <span
            key={w.world}
            className="rounded-full border border-white/10 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400"
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: WORLD_COLORS[w.world] }}
            />
            W{w.world}: {w.name}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Map board */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          {/* terrain */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 20% 80%, rgba(16,185,129,0.12), transparent),
                radial-gradient(ellipse 60% 40% at 70% 40%, rgba(56,189,248,0.1), transparent),
                radial-gradient(ellipse 50% 50% at 80% 70%, rgba(192,132,252,0.12), transparent),
                radial-gradient(ellipse 40% 40% at 40% 15%, rgba(244,114,182,0.1), transparent),
                linear-gradient(165deg, #0c0c0f 0%, #12141a 40%, #0a0f0c 100%)
              `,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative aspect-[16/11] w-full min-h-[420px]">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {pathLines.map(({ from, to, key }) => {
                const unlocked = isLevelUnlocked(to, progress);
                const done =
                  isLevelCompleted(from.id, progress) &&
                  isLevelCompleted(to.id, progress);
                return (
                  <path
                    key={key}
                    d={curvePath(from.x, from.y, to.x, to.y)}
                    fill="none"
                    stroke={done ? "#a78bfa" : unlocked ? "#52525b" : "#27272a"}
                    strokeWidth={done ? 0.9 : 0.55}
                    strokeDasharray={done ? undefined : "1.2 1"}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ strokeWidth: done ? 3 : 2 }}
                  />
                );
              })}
            </svg>

            {CAMPAIGN_LEVELS.map((level) => {
              const unlocked = isLevelUnlocked(level, progress);
              const done = isLevelCompleted(level.id, progress);
              const starCount = progress.stars[level.id] ?? 0;
              const color = WORLD_COLORS[level.world] ?? "#a1a1aa";
              const isSelected = selected?.id === level.id;

              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => setSelected(level)}
                  className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition ${
                    unlocked ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-50"
                  } ${isSelected ? "scale-110" : ""}`}
                  style={{ left: `${level.x}%`, top: `${level.y}%` }}
                  title={level.mapLabel}
                >
                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg ${
                      done
                        ? "border-white/40 bg-zinc-900"
                        : unlocked
                          ? "border-white/20 bg-zinc-900 animate-pulse-slow"
                          : "border-white/10 bg-zinc-950"
                    }`}
                    style={{
                      boxShadow: unlocked
                        ? `0 0 20px ${color}55, 0 4px 12px rgba(0,0,0,0.5)`
                        : undefined,
                      borderColor: done || unlocked ? color : undefined,
                    }}
                  >
                    {!unlocked ? (
                      <Lock className="h-4 w-4 text-zinc-600" />
                    ) : done ? (
                      <Trophy className="h-4 w-4" style={{ color }} />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {level.world}-{level.id.split("-").pop()?.replace("l", "")}
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-1 max-w-[88px] truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      unlocked ? "bg-black/60 text-zinc-100" : "bg-black/40 text-zinc-600"
                    }`}
                  >
                    {level.mapLabel}
                  </span>
                  {done && starCount > 0 ? (
                    <span className="mt-0.5 flex gap-0.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-2.5 w-2.5 ${
                            i < starCount ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                          }`}
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level detail card */}
        <aside className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          {selected ? (
            <LevelCard
              level={selected}
              progress={progress}
              onPlay={refresh}
            />
          ) : (
            <div className="flex h-full min-h-[240px] flex-col justify-center text-center text-sm text-zinc-500">
              <MapIcon className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              Select a node on the map to inspect the level.
              <p className="mt-2 text-xs text-zinc-600">
                Start at the green trailhead: <strong className="text-zinc-400">Tiny Links</strong>
              </p>
            </div>
          )}
        </aside>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/"
          className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
        >
          Free practice (all problems)
        </Link>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all campaign progress?")) {
              localStorage.removeItem("sdl-campaign-progress-v1");
              refresh();
              setSelected(null);
            }
          }}
          className="rounded-lg border border-white/10 px-3 py-2 text-zinc-600 hover:text-rose-400"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}

function LevelCard({
  level,
  progress,
}: {
  level: CampaignLevelNode;
  progress: CampaignProgress;
  onPlay: () => void;
}) {
  const problem = getProblemById(level.problemId);
  const unlocked = isLevelUnlocked(level, progress);
  const done = isLevelCompleted(level.id, progress);
  const color = WORLD_COLORS[level.world] ?? "#a1a1aa";

  return (
    <div className="flex h-full flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        World {level.world} · {level.worldName}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white">{level.mapLabel}</h2>
      {problem ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{problem.summary}</p>
      ) : null}
      {level.flavor ? (
        <p className="mt-2 text-xs italic text-zinc-500">&ldquo;{level.flavor}&rdquo;</p>
      ) : null}

      <ul className="mt-4 space-y-1.5 text-xs text-zinc-500">
        <li>
          Difficulty:{" "}
          <span className="capitalize text-zinc-300">{problem?.difficulty ?? "—"}</span>
        </li>
        <li>
          Track:{" "}
          <span className="capitalize text-zinc-300">{problem?.track ?? "—"}</span>
        </li>
        <li>
          Wrenches to survive:{" "}
          <span className="text-zinc-300">{level.wrenchCount}</span>
        </li>
        <li>
          Pass score: <span className="text-zinc-300">{level.passScore}+</span>
        </li>
      </ul>

      <div className="mt-auto pt-6">
        {!unlocked ? (
          <p className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5" />
            Clear previous levels on the path to unlock.
          </p>
        ) : (
          <Link
            href={campaignHref(level.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
            style={{ backgroundColor: color }}
          >
            {done ? "Replay level" : "Enter level"}
            <Swords className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-lg font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}

/** Gentle bezier between two % points */
function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // perpendicular offset for a slight arc
  const cx = mx - dy * 0.15;
  const cy = my + dx * 0.15;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}
