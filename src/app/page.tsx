"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DIFFICULTY_META, PROBLEMS, TRACK_META } from "@/lib/problems";
import type { Difficulty, ProblemTrack } from "@/lib/types";
import {
  ArrowRight,
  Bot,
  Layers,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

const ORDER: Difficulty[] = ["easy", "medium", "hard"];
type TrackFilter = "all" | ProblemTrack;

export default function HomePage() {
  const [track, setTrack] = useState<TrackFilter>("all");

  const filtered = useMemo(() => {
    if (track === "all") return PROBLEMS;
    return PROBLEMS.filter((p) => p.track === track);
  }, [track]);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08),_transparent_40%)]" />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-16">
        <header className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            SpaceXAI · classic systems + agentic workflows
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Design systems.
            <span className="block text-zinc-400">Survive the campaign.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Walk a Zelda-style map of levels. Deploy your architecture — the AI throws a{" "}
            <span className="text-zinc-200">wrench</span> (latency, security, DB overflow,
            agent failure). Fix it or the path stays locked. Or free-practice any problem
            below.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/campaign"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500"
            >
              Play campaign
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Training · show me how
            </Link>
            <a
              href="#practice"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5"
            >
              Free practice
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Bot,
                title: "Training mode",
                body: "Bare-bones systems + SVG tips. Learn cache, DLQ, RAG, when keywords mean which tool.",
              },
              {
                icon: Layers,
                title: "Campaign + practice",
                body: "Map levels with AI wrenches, or free-design classic and agentic problems.",
              },
              {
                icon: Target,
                title: "Socratic follow-ups",
                body: "Miss redundancy or evals? The interviewer asks where to improve.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-zinc-900/50 p-4"
              >
                <Icon className="mb-2 h-5 w-5 text-sky-400" />
                <p className="text-sm font-medium text-zinc-100">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </header>

        <div id="practice" className="mb-8 flex flex-wrap gap-2 scroll-mt-8">
          {(
            [
              { id: "all" as const, label: "All problems" },
              { id: "agentic" as const, label: TRACK_META.agentic.label },
              { id: "classic" as const, label: TRACK_META.classic.label },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTrack(opt.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                track === opt.id
                  ? "border-violet-500/50 bg-violet-500/20 text-violet-200"
                  : "border-white/10 bg-zinc-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(track === "all" || track === "agentic") && (
          <p className="mb-6 flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-zinc-400">
            <Workflow className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
            Agentic tips: wire <strong className="font-medium text-zinc-300">Agent → Tool → Agent</strong>{" "}
            for multi-step feedback, pick an <strong className="font-medium text-zinc-300">LLM model</strong>,
            parallelize with multi-agent / fan-out, and add{" "}
            <strong className="font-medium text-zinc-300">span or e2e evals</strong> — the interviewer will ask.
          </p>
        )}

        <div className="space-y-10">
          {ORDER.map((difficulty) => {
            const meta = DIFFICULTY_META[difficulty];
            const problems = filtered.filter((p) => p.difficulty === difficulty);
            if (problems.length === 0) return null;
            return (
              <section key={difficulty}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className={`text-lg font-semibold ${meta.color}`}>{meta.label}</h2>
                  <p className="text-sm text-zinc-600">{meta.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {problems.map((problem) => {
                    const t = TRACK_META[problem.track];
                    return (
                      <Link
                        key={problem.id}
                        href={`/design/${problem.id}`}
                        className="group flex flex-col rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition hover:border-violet-500/40 hover:bg-zinc-900/80"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${t.badge}`}
                          >
                            {t.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-zinc-50 group-hover:text-white">
                          {problem.title}
                        </h3>
                        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-500">
                          {problem.summary}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {problem.evaluationFocus.slice(0, 3).map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 opacity-0 transition group-hover:opacity-100">
                          Open canvas
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-600">
          Powered by SpaceXAI (xAI) · set <code className="text-zinc-400">XAI_API_KEY</code> in{" "}
          <code className="text-zinc-400">.env.local</code>
        </footer>
      </div>
    </div>
  );
}
