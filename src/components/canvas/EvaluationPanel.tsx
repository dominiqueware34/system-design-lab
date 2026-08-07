"use client";

import type { EvaluationResult, FollowUpChallenge } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  Sparkles,
  X,
} from "lucide-react";

interface EvaluationPanelProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  evaluation: EvaluationResult | null;
  activeFollowUp: FollowUpChallenge | null;
  onClose: () => void;
  onSubmitFix: () => void;
  onDismissFollowUp: () => void;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-200">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function EvaluationPanel({
  open,
  loading,
  error,
  evaluation,
  activeFollowUp,
  onClose,
  onSubmitFix,
  onDismissFollowUp,
}: EvaluationPanelProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-3 right-3 z-20 w-[min(420px,calc(100%-1.5rem))] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-100">AI Interviewer</h2>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">
            SpaceXAI · grok-4.5
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          aria-label="Close evaluation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[55vh] space-y-4 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <p className="text-sm">Reviewing your architecture JSON…</p>
          </div>
        ) : null}

        {error ? (
          <div className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {evaluation && !loading ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Score</p>
                <p className="text-3xl font-bold tabular-nums text-zinc-50">
                  {evaluation.score}
                  <span className="text-base font-normal text-zinc-500">/100</span>
                </p>
              </div>
              {evaluation.isComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300">
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  Follow-up
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-zinc-300">{evaluation.summary}</p>

            <div className="grid grid-cols-2 gap-3">
              <ScoreBar label="Latency" score={evaluation.dimensions.latency.score} />
              <ScoreBar label="Reliability" score={evaluation.dimensions.reliability.score} />
              <ScoreBar label="Scale" score={evaluation.dimensions.scale.score} />
              <ScoreBar label="Correctness" score={evaluation.dimensions.correctness.score} />
              <ScoreBar
                label="Evals / measurement"
                score={evaluation.dimensions.evaluation.score}
              />
            </div>

            {evaluation.strengths.length > 0 ? (
              <section>
                <h3 className="mb-1 text-xs font-semibold text-emerald-400">Strengths</h3>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-zinc-400">
                  {evaluation.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {evaluation.gaps.length > 0 ? (
              <section>
                <h3 className="mb-1 text-xs font-semibold text-rose-400">Gaps</h3>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-zinc-400">
                  {evaluation.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(activeFollowUp || evaluation.followUp) && !evaluation.isComplete ? (
              <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                  Interviewer challenge
                  {(activeFollowUp ?? evaluation.followUp)?.kind
                    ? ` · ${(activeFollowUp ?? evaluation.followUp)!.kind}`
                    : ""}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-100">
                  {(activeFollowUp ?? evaluation.followUp)!.question}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Scenario: {(activeFollowUp ?? evaluation.followUp)!.failureScenario}
                </p>
                {(activeFollowUp ?? evaluation.followUp)!.relatedComponentTypes.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(activeFollowUp ?? evaluation.followUp)!.relatedComponentTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-[11px] text-zinc-500">
                  Update your canvas (add/configure components, wire connections), then submit
                  your fix.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={onSubmitFix}
                    className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
                  >
                    Submit fix
                  </button>
                  <button
                    type="button"
                    onClick={onDismissFollowUp}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:bg-white/5"
                  >
                    Skip
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
