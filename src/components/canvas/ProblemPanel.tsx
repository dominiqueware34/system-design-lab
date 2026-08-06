"use client";

import { useState } from "react";
import type { DesignProblem } from "@/lib/types";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { DIFFICULTY_META } from "@/lib/problems";

export function ProblemPanel({ problem }: { problem: DesignProblem }) {
  const [expanded, setExpanded] = useState(true);
  const meta = DIFFICULTY_META[problem.difficulty];

  return (
    <div className="absolute left-3 top-3 z-10 w-80 max-w-[calc(100%-1.5rem)] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-2 p-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-sky-400" />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <h1 className="mt-1 text-sm font-semibold text-zinc-50">{problem.title}</h1>
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{problem.summary}</p>
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
        )}
      </button>

      {expanded ? (
        <div className="max-h-[50vh] space-y-3 overflow-y-auto border-t border-white/10 px-3 pb-3 pt-2 text-xs">
          <p className="leading-relaxed text-zinc-400">{problem.description}</p>

          <section>
            <h3 className="mb-1 font-semibold text-zinc-300">Requirements</h3>
            <ul className="list-inside list-disc space-y-0.5 text-zinc-500">
              {problem.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-zinc-300">Constraints</h3>
            <dl className="space-y-1 text-zinc-500">
              {Object.entries(problem.constraints).map(([key, value]) => {
                if (!value) return null;
                if (Array.isArray(value)) {
                  return (
                    <div key={key}>
                      <dt className="inline font-medium text-zinc-400">{key}: </dt>
                      <dd className="inline">{value.join("; ")}</dd>
                    </div>
                  );
                }
                return (
                  <div key={key}>
                    <dt className="inline font-medium text-zinc-400">{key}: </dt>
                    <dd className="inline">{value}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-zinc-300">Focus areas</h3>
            <div className="flex flex-wrap gap-1">
              {problem.evaluationFocus.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300"
                >
                  {f}
                </span>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
