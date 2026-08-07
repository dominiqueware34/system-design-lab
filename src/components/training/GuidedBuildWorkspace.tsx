"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronUp,
  GraduationCap,
  KeyRound,
  Minimize2,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { DesignNode } from "@/components/canvas/DesignNode";
import { graphThroughStep, type GuidedBuild } from "@/lib/guided-builds";
import { TOPIC_META } from "@/lib/training-lessons";

const nodeTypes = { design: DesignNode };

function GuidedInner({ build }: { build: GuidedBuild }) {
  const { fitView } = useReactFlow();
  const [step, setStep] = useState(0);
  const [coachOpen, setCoachOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);

  const graph = useMemo(() => graphThroughStep(build, step), [build, step]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  const current = build.steps[step];
  const isLast = step >= build.steps.length - 1;
  const isFirst = step <= 0;
  const topic = TOPIC_META[build.topic];

  useEffect(() => {
    const g = graphThroughStep(build, step);
    setNodes(g.nodes);
    setEdges(g.edges);
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
  }, [build, step, setNodes, setEdges, fitView]);

  const go = useCallback(
    (next: number) => {
      setStep(Math.max(0, Math.min(build.steps.length - 1, next)));
    },
    [build.steps.length]
  );

  const reset = () => go(0);

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/training"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Training
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <p className="text-sm font-semibold">{build.title}</p>
            <p className={`text-[11px] ${topic.color}`}>
              Show me how · {topic.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
            Step {step + 1}/{build.steps.length}
          </span>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Step list */}
        <aside
          className={`flex shrink-0 flex-col border-r border-white/10 bg-zinc-950/90 transition-all ${
            listOpen ? "w-64" : "w-12"
          }`}
        >
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            {listOpen ? (
              <>
                <span className="font-medium text-zinc-300">Steps</span>
                <ChevronUp className="h-3.5 w-3.5 rotate-[-90deg]" />
              </>
            ) : (
              <Play className="mx-auto h-4 w-4 text-sky-400" />
            )}
          </button>
          {listOpen ? (
            <ol className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {build.steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition ${
                        active
                          ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-500/40"
                          : done
                            ? "text-zinc-400 hover:bg-white/5"
                            : "text-zinc-600 hover:bg-white/5 hover:text-zinc-400"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          active
                            ? "bg-sky-500 text-zinc-950"
                            : done
                              ? "bg-emerald-500/30 text-emerald-300"
                              : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className="min-w-0 leading-snug">{s.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </aside>

        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-zinc-950"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#71717a", strokeWidth: 1.5 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#27272a" />
            <Controls className="!border-white/10 !bg-zinc-900 [&>button]:!border-white/10 [&>button]:!bg-zinc-900 [&>button]:!fill-zinc-300" />
          </ReactFlow>

          {/* Bottom transport controls */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/95 px-3 py-2 shadow-2xl backdrop-blur">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => go(step - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40"
            >
              <SkipBack className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => go(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
            >
              {isLast ? "Done" : "Next step"}
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            {isLast ? (
              <Link
                href="/training"
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Finish
              </Link>
            ) : null}
          </div>

          {/* Coach */}
          {!coachOpen ? (
            <button
              type="button"
              onClick={() => setCoachOpen(true)}
              className="absolute left-3 top-3 z-10 flex max-w-[min(340px,calc(100%-1.5rem))] items-start gap-2 rounded-xl border border-sky-500/30 bg-zinc-950/90 px-3 py-2.5 text-left shadow-lg backdrop-blur hover:border-sky-400/50"
            >
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sky-300">
                  Step {step + 1}: {current.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{current.why}</p>
                <p className="mt-1 text-[10px] text-sky-500">Tap to expand · canvas free</p>
              </div>
            </button>
          ) : (
            <div className="absolute left-3 top-3 z-10 w-[min(380px,calc(100%-1.5rem))] overflow-hidden rounded-xl border border-sky-500/25 bg-zinc-950/95 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 bg-sky-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <Play className="h-3.5 w-3.5" />
                  Show me how · step {step + 1}/{build.steps.length}
                </div>
                <button
                  type="button"
                  onClick={() => setCoachOpen(false)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  aria-label="Minimize"
                  title="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[min(55vh,calc(100dvh-10rem))] space-y-3 overflow-y-auto p-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                    Building
                  </p>
                  <p className="text-sm font-semibold text-zinc-100">{current.title}</p>
                </div>

                <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 p-2.5">
                  <p className="font-semibold text-sky-300">Why this node</p>
                  <p className="mt-1 leading-relaxed text-zinc-200">{current.why}</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-2.5">
                  <p className="font-semibold text-zinc-300">Because…</p>
                  <p className="mt-1 leading-relaxed text-zinc-400">{current.because}</p>
                </div>

                {current.keywords && current.keywords.length > 0 ? (
                  <div>
                    <p className="flex items-center gap-1 font-medium text-zinc-300">
                      <KeyRound className="h-3 w-3 text-violet-400" />
                      Listen for
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {current.keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {current.addNodes.length > 0 ? (
                  <div>
                    <p className="font-medium text-zinc-300">Added this step</p>
                    <ul className="mt-1 space-y-0.5 text-zinc-500">
                      {current.addNodes.map((n) => (
                        <li key={n.id}>
                          + {n.label ?? n.componentType}{" "}
                          <span className="font-mono text-[10px] text-zinc-600">
                            ({n.componentType})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-zinc-500">
                    No new boxes — wiring / feedback loop only.
                  </p>
                )}

                {isLast ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                    <p className="font-semibold text-emerald-300">Architecture complete</p>
                    <p className="mt-1 leading-relaxed text-emerald-100/90">
                      {build.outcome}
                    </p>
                  </div>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => go(step - 1)}
                    className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => go(step + 1)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GuidedBuildWorkspace({ build }: { build: GuidedBuild }) {
  return (
    <ReactFlowProvider>
      <GuidedInner build={build} />
    </ReactFlowProvider>
  );
}
