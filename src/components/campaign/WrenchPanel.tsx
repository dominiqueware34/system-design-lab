"use client";

import type { DesignWrench } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Waypoints,
  X,
  Zap,
} from "lucide-react";

const CATEGORY_STYLE: Record<string, string> = {
  latency: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  security: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  capacity: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  failure: "border-red-500/40 bg-red-500/10 text-red-300",
  cost: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  data: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  evals: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  agent: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300",
};

interface WrenchPanelProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  wrench: DesignWrench | null;
  phase: "design" | "wrench" | "fixing" | "passed" | "failed";
  wrenchIndex: number;
  totalWrenches: number;
  fixFeedback: string | null;
  passed: boolean;
  onClose: () => void;
  onSubmitFix: () => void;
  onContinueToMap: () => void;
  /** Optional: open data-flow playback after pass */
  onWatchFlow?: () => void;
}

export function WrenchPanel({
  open,
  loading,
  error,
  wrench,
  phase,
  wrenchIndex,
  totalWrenches,
  fixFeedback,
  passed,
  onClose,
  onSubmitFix,
  onContinueToMap,
  onWatchFlow,
}: WrenchPanelProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-3 right-3 z-30 w-[min(440px,calc(100%-1.5rem))] overflow-hidden rounded-xl border border-rose-500/30 bg-zinc-950/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-rose-500/20 bg-rose-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            {passed ? "Level cleared!" : "Chaos event"}
          </h2>
          {!passed && totalWrenches > 0 ? (
            <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-zinc-400">
              Wrench {Math.min(wrenchIndex + 1, totalWrenches)}/{totalWrenches}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
            <p className="text-sm">
              {phase === "fixing"
                ? "Checking if your fix holds…"
                : "Chaos engineer inspecting your architecture…"}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {passed && !loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">You survived the wrenches</p>
            </div>
            {fixFeedback ? (
              <p className="text-sm leading-relaxed text-zinc-300">{fixFeedback}</p>
            ) : null}
            {onWatchFlow ? (
              <button
                type="button"
                onClick={onWatchFlow}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                <Waypoints className="h-4 w-4" />
                Watch how traffic would flow
              </button>
            ) : null}
            <button
              type="button"
              onClick={onContinueToMap}
              className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Return to campaign map
            </button>
          </div>
        ) : null}

        {wrench && !loading && !passed ? (
          <>
            <div
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                CATEGORY_STYLE[wrench.category] ?? CATEGORY_STYLE.failure
              }`}
            >
              {wrench.category} · severity {wrench.severity}
            </div>
            <h3 className="text-lg font-semibold text-white">{wrench.headline}</h3>
            <p className="text-sm font-medium text-rose-200/90">{wrench.title}</p>
            <p className="text-sm leading-relaxed text-zinc-300">{wrench.narrative}</p>

            <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Impact
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">{wrench.impact}</p>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                Why your design
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                {wrench.whyThisDesign}
              </p>
            </div>

            <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-300">
                <Zap className="h-3 w-3" />
                Your mission
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {wrench.challengeQuestion}
              </p>
              {wrench.relatedComponentTypes.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {wrench.relatedComponentTypes.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {fixFeedback ? (
              <p className="text-xs text-zinc-500">{fixFeedback}</p>
            ) : null}

            <button
              type="button"
              onClick={onSubmitFix}
              className="w-full rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Submit fix for this wrench
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
