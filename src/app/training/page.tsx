"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TRAINING_LESSONS,
  TOPIC_META,
  TOOL_CHEATSHEET,
  loadTrainingProgress,
  resetTrainingProgress,
  type TrainingProgress,
  type TrainingTopic,
} from "@/lib/training-lessons";
import { GUIDED_BUILDS } from "@/lib/guided-builds";
import { DIAGRAM_MAP } from "@/components/diagrams/ConceptDiagrams";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Play,
  RotateCcw,
} from "lucide-react";

const ORDER: TrainingTopic[] = [
  "latency",
  "scaling",
  "redundancy",
  "async",
  "agentic",
];

type Tab = "lessons" | "guided" | "cheatsheet";

export default function TrainingIndexPage() {
  const [tab, setTab] = useState<Tab>("guided");
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  useEffect(() => {
    setProgress(loadTrainingProgress());
  }, []);

  const completed = useMemo(
    () => new Set(progress?.completedLessonIds ?? []),
    [progress]
  );
  const doneCount = completed.size;
  const total = TRAINING_LESSONS.length;

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="border-b border-white/10 px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
          <GraduationCap className="h-3.5 w-3.5" />
          Training mode
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Learn when to use what
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          <strong className="font-medium text-zinc-300">Show me how</strong> walks through a
          full design step by step — each node appears with why it&apos;s there. Interactive
          lessons leave a gap for you to fill. The cheat sheet maps interview keywords to tools.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-1.5 text-zinc-400">
            Progress:{" "}
            <span className="font-semibold text-zinc-100">
              {doneCount}/{total}
            </span>{" "}
            lessons
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabBtn active={tab === "guided"} onClick={() => setTab("guided")}>
            <Play className="mr-1.5 inline h-3.5 w-3.5" />
            Show me how
          </TabBtn>
          <TabBtn active={tab === "lessons"} onClick={() => setTab("lessons")}>
            Interactive lessons
          </TabBtn>
          <TabBtn active={tab === "cheatsheet"} onClick={() => setTab("cheatsheet")}>
            <BookOpen className="mr-1.5 inline h-3.5 w-3.5" />
            When to use what
          </TabBtn>
        </div>

        {tab === "guided" ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {GUIDED_BUILDS.map((build) => {
              const meta = TOPIC_META[build.topic];
              return (
                <Link
                  key={build.id}
                  href={`/training/guided/${build.id}`}
                  className="group rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition hover:border-sky-500/40 hover:bg-zinc-900/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                      <Play className="h-4 w-4" />
                    </span>
                    <span className={`text-[11px] font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="mt-3 font-medium text-zinc-50 group-hover:text-white">
                    {build.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-zinc-500">{build.summary}</p>
                  <p className="mt-2 line-clamp-2 text-[11px] text-zinc-600">
                    {build.problem}
                  </p>
                  <p className="mt-3 text-[11px] text-zinc-500">
                    {build.steps.length} steps
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-400 opacity-0 transition group-hover:opacity-100">
                    Watch build
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}

        {tab === "lessons" ? (
          <div className="mt-10 space-y-10">
            {ORDER.map((topic) => {
              const meta = TOPIC_META[topic];
              const lessons = TRAINING_LESSONS.filter((l) => l.topic === topic).sort(
                (a, b) => a.order - b.order
              );
              if (!lessons.length) return null;
              return (
                <section key={topic}>
                  <h2 className={`text-lg font-semibold ${meta.color}`}>{meta.label}</h2>
                  <p className="mb-3 text-sm text-zinc-600">{meta.description}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lessons.map((lesson) => {
                      const done = completed.has(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          href={`/training/${lesson.id}`}
                          className="group relative rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition hover:border-sky-500/40 hover:bg-zinc-900/80"
                        >
                          {done ? (
                            <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-400" />
                          ) : null}
                          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                            Lesson {lesson.order}
                          </p>
                          <h3 className="mt-0.5 pr-6 font-medium text-zinc-50 group-hover:text-white">
                            {lesson.title}
                          </h3>
                          <p className="mt-1.5 text-sm text-zinc-500">{lesson.summary}</p>
                          <p className="mt-2 text-[11px] leading-snug text-zinc-600">
                            <span className="text-zinc-500">Add: </span>
                            {lesson.requiredTypes.join(" + ")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {lesson.keywords.slice(0, 4).map((k) => (
                              <span
                                key={k}
                                className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-400 opacity-0 transition group-hover:opacity-100">
                            {done ? "Replay" : "Start lesson"}
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
        ) : (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-zinc-500">
              Interview signal → tool. Expand a row for anti-patterns and linked lessons.
            </p>
            {TOOL_CHEATSHEET.map((tool) => {
              const open = expandedTool === tool.id;
              const Diagram = tool.diagramId ? DIAGRAM_MAP[tool.diagramId] : null;
              return (
                <div
                  key={tool.id}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedTool(open ? null : tool.id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100">{tool.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{tool.whenToUse}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tool.keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-600">
                      {open ? "Hide" : "Details"}
                    </span>
                  </button>
                  {open ? (
                    <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
                      <p className="text-xs text-zinc-500">
                        <span className="font-medium text-zinc-400">Avoid: </span>
                        {tool.antiPatterns}
                      </p>
                      {Diagram ? (
                        <div className="max-w-lg">
                          <Diagram />
                        </div>
                      ) : null}
                      {tool.relatedLessonIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tool.relatedLessonIds.map((id) => {
                            const lesson = TRAINING_LESSONS.find((l) => l.id === id);
                            if (!lesson) return null;
                            return (
                              <Link
                                key={id}
                                href={`/training/${id}`}
                                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300 hover:bg-sky-500/20"
                              >
                                Practice: {lesson.title}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <Link
            href="/campaign"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Campaign map →
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset all training progress?")) {
                resetTrainingProgress();
                setProgress(loadTrainingProgress());
              }
            }}
            className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-rose-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset training progress
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-sky-500/50 bg-sky-500/20 text-sky-200"
          : "border-white/10 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
