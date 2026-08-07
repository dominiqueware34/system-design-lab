"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Node,
  type NodeTypes,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  KeyRound,
  Lightbulb,
  MapPin,
  Minimize2,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { DesignNode } from "@/components/canvas/DesignNode";
import { ComponentPalette } from "@/components/canvas/ComponentPalette";
import { AttributesPanel } from "@/components/canvas/AttributesPanel";
import { HintNode } from "@/components/training/HintNode";
import { DIAGRAM_MAP } from "@/components/diagrams/ConceptDiagrams";
import {
  defaultAttributes,
  getComponentByType,
} from "@/lib/component-catalog";
import {
  buildStarterGraph,
  checkLessonProgress,
  getPlacementGuide,
  markLessonComplete,
  nextLesson,
  prevLesson,
  TOPIC_META,
  type TrainingLesson,
} from "@/lib/training-lessons";
import type { AttributeValue, DesignNodeData } from "@/lib/types";

const nodeTypes: NodeTypes = {
  design: DesignNode,
  hint: HintNode,
};

const HINT_NODE_ID = "__placement_hint__";

/** Design nodes + optional placement ghost */
type CanvasNode = Node<DesignNodeData | Record<string, unknown>>;

function TrainingInner({ lesson }: { lesson: TrainingLesson }) {
  const starter = useMemo(() => buildStarterGraph(lesson), [lesson]);
  const placement = useMemo(() => getPlacementGuide(lesson), [lesson]);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(
    starter.nodes as CanvasNode[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(starter.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  /** Coach starts minimized so canvas is visible; expand for details */
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachExpanded, setCoachExpanded] = useState(false);

  const nxt = nextLesson(lesson.id);
  const prv = prevLesson(lesson.id);

  const mergeWithHint = useCallback(
    (graphNodes: CanvasNode[], showHint: boolean): CanvasNode[] => {
      const withoutHint = graphNodes.filter((n) => n.id !== HINT_NODE_ID);
      if (!showHint) return withoutHint;
      const typeLabels = lesson.requiredTypes
        .map((t) => getComponentByType(t)?.label ?? t)
        .join(" + ");
      const hintNode: CanvasNode = {
        id: HINT_NODE_ID,
        type: "hint",
        position: placement.position,
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: 1000,
        data: {
          label: typeLabels,
          sublabel: placement.between
            ? `Between ${placement.between.fromLabel} ↔ ${placement.between.toLabel}`
            : "Follow the coach placement tip",
        },
      };
      return [...withoutHint, hintNode];
    },
    [lesson.requiredTypes, placement]
  );

  useEffect(() => {
    const g = buildStarterGraph(lesson);
    setNodes(mergeWithHint(g.nodes as CanvasNode[], true));
    setEdges(g.edges);
    setCelebrated(false);
    setSelectedId(null);
    setCoachOpen(false);
    setCoachExpanded(false);
    requestAnimationFrame(() => fitView({ padding: 0.25 }));
  }, [lesson, setNodes, setEdges, fitView, mergeWithHint]);

  const designNodes = useMemo(
    () =>
      nodes.filter((n) => n.id !== HINT_NODE_ID && n.type === "design") as Node<DesignNodeData>[],
    [nodes]
  );

  const progress = useMemo(
    () => checkLessonProgress(lesson, designNodes, edges),
    [lesson, designNodes, edges]
  );

  // Hide ghost when complete; show when incomplete
  useEffect(() => {
    setNodes((nds) => {
      const base = nds.filter((n) => n.id !== HINT_NODE_ID);
      return mergeWithHint(base, !progress.complete);
    });
  }, [progress.complete, mergeWithHint, setNodes]);

  useEffect(() => {
    if (progress.complete) {
      setCelebrated(true);
      markLessonComplete(lesson.id);
      setCoachOpen(true);
      setCoachExpanded(true);
    }
  }, [progress.complete, lesson.id]);

  const selectedData = useMemo((): DesignNodeData | null => {
    if (!selectedId || selectedId === HINT_NODE_ID) return null;
    const n = designNodes.find((node) => node.id === selectedId);
    return n?.data ?? null;
  }, [designNodes, selectedId]);

  const Diagram = DIAGRAM_MAP[lesson.diagramId];
  const topic = TOPIC_META[lesson.topic];

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source === HINT_NODE_ID || c.target === HINT_NODE_ID) return;
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            animated: true,
            style: { stroke: "#71717a", strokeWidth: 1.5 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/system-design-component");
      if (!type) return;
      const definition = getComponentByType(type);
      if (!definition) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const id = `${definition.type}-${crypto.randomUUID().slice(0, 8)}`;
      const newNode: CanvasNode = {
        id,
        type: "design",
        position,
        data: {
          componentType: definition.type,
          label: definition.label,
          category: definition.category,
          color: definition.color,
          icon: definition.icon,
          attributes: defaultAttributes(definition),
        } satisfies DesignNodeData,
      };
      setNodes((nds) => {
        const base = nds.filter((n) => n.id !== HINT_NODE_ID);
        return mergeWithHint([...base, newNode], true);
      });
      setSelectedId(id);
    },
    [screenToFlowPosition, setNodes, mergeWithHint]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onNodesChangeSafe = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      const filtered = changes.filter((c) => {
        if ("id" in c && c.id === HINT_NODE_ID) {
          // allow only select/dimension; block remove/position drag via node props
          if (c.type === "remove" || c.type === "position") return false;
        }
        return true;
      });
      onNodesChange(filtered);
    },
    [onNodesChange]
  );

  const onAttributeChange = useCallback(
    (nodeId: string, attributes: Record<string, AttributeValue>, label?: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId && n.type === "design"
            ? {
                ...n,
                data: {
                  ...(n.data as DesignNodeData),
                  attributes,
                  ...(label !== undefined ? { label } : {}),
                },
              }
            : n
        )
      );
    },
    [setNodes]
  );

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === HINT_NODE_ID) return;
      const starterNode = lesson.starterNodes.find((n) => n.id === nodeId);
      if (starterNode && starterNode.locked !== false) return;
      setNodes((nds) => {
        const base = nds.filter((n) => n.id !== nodeId && n.id !== HINT_NODE_ID);
        return mergeWithHint(base, true);
      });
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedId(null);
    },
    [lesson.starterNodes, setNodes, setEdges, mergeWithHint]
  );

  const resetLesson = () => {
    const g = buildStarterGraph(lesson);
    setNodes(mergeWithHint(g.nodes as CanvasNode[], true));
    setEdges(g.edges);
    setCelebrated(false);
    setSelectedId(null);
    requestAnimationFrame(() => fitView({ padding: 0.25 }));
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/training"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Lessons
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <p className="text-sm font-semibold">{lesson.title}</p>
            <p className={`text-[11px] ${topic.color}`}>
              {topic.label} · Lesson {lesson.order}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCoachOpen(true);
              setCoachExpanded(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs text-sky-300 hover:bg-sky-500/20"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Coach
          </button>
          <button
            type="button"
            onClick={resetLesson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <div
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              progress.complete
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-white/10 bg-zinc-900 text-zinc-400"
            }`}
          >
            {progress.complete
              ? "Complete"
              : `${progress.found.length}/${lesson.requiredTypes.length} pieces`}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ComponentPalette />

        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeSafe}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={(p: OnSelectionChangeParams) =>
              setSelectedId(p.nodes[0]?.id ?? null)
            }
            nodeTypes={nodeTypes}
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

          {/* Compact placement banner — always visible, non-blocking */}
          {!progress.complete ? (
            <div className="absolute bottom-3 left-1/2 z-10 w-[min(440px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-sky-500/35 bg-sky-950/90 px-4 py-2.5 shadow-xl backdrop-blur">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                <MapPin className="h-3.5 w-3.5" />
                Where to place it
              </p>
              <p className="mt-1 text-center text-sm leading-snug text-zinc-100">
                {placement.text}
              </p>
              <p className="mt-1 text-center text-[11px] text-zinc-500">
                Look for the glowing <span className="text-sky-300">Drop here</span> marker on
                the canvas
              </p>
            </div>
          ) : null}

          {/* Minimized coach chip */}
          {!coachOpen ? (
            <button
              type="button"
              onClick={() => setCoachOpen(true)}
              className="absolute left-3 top-3 z-10 flex max-w-[min(320px,calc(100%-1.5rem))] items-start gap-2 rounded-xl border border-sky-500/30 bg-zinc-950/90 px-3 py-2.5 text-left shadow-lg backdrop-blur hover:border-sky-400/50"
            >
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-sky-300">Training coach</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{lesson.objective}</p>
                <p className="mt-1 text-[10px] text-sky-500">Tap to expand tips · canvas free</p>
              </div>
            </button>
          ) : (
            <div className="absolute left-3 top-3 z-10 w-[min(360px,calc(100%-1.5rem))] overflow-hidden rounded-xl border border-sky-500/25 bg-zinc-950/95 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 bg-sky-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Training coach
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCoachExpanded((e) => !e)}
                    className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    aria-label={coachExpanded ? "Show less" : "Show more"}
                    title={coachExpanded ? "Show less" : "Show more"}
                  >
                    {coachExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoachOpen(false)}
                    className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    aria-label="Minimize coach"
                    title="Minimize — free the canvas"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[min(70vh,calc(100dvh-8rem))] space-y-3 overflow-y-auto p-3 text-xs">
                <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 p-2.5">
                  <p className="flex items-center gap-1 font-semibold text-sky-300">
                    <MapPin className="h-3 w-3" />
                    Place it here
                  </p>
                  <p className="mt-1 leading-relaxed text-zinc-200">{placement.text}</p>
                </div>

                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5">
                  <p className="flex items-center gap-1 font-semibold text-amber-300">
                    <Target className="h-3 w-3" />
                    Objective
                  </p>
                  <p className="mt-1 leading-relaxed text-zinc-200">{lesson.objective}</p>
                  {!progress.complete ? (
                    <p className="mt-2 text-[11px] text-zinc-500">{progress.hint}</p>
                  ) : null}
                  {progress.found.length > 0 && !progress.complete ? (
                    <p className="mt-1 text-[11px] text-emerald-400/80">
                      Found: {progress.found.join(", ")}
                    </p>
                  ) : null}
                </div>

                {progress.complete ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-100">
                    <p className="flex items-center gap-1 font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Why that works
                    </p>
                    <p className="mt-1 leading-relaxed">{lesson.successMessage}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nxt ? (
                        <Link
                          href={`/training/${nxt.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                        >
                          Next: {nxt.title}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Link
                          href="/training"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                        >
                          All lessons
                        </Link>
                      )}
                    </div>
                  </div>
                ) : null}

                {coachExpanded ? (
                  <>
                    <div>
                      <p className="font-medium text-zinc-200">Scenario</p>
                      <p className="mt-1 leading-relaxed text-zinc-400">{lesson.scenario}</p>
                    </div>

                    <div>
                      <p className="flex items-center gap-1 font-medium text-zinc-300">
                        <Lightbulb className="h-3 w-3 text-amber-400" />
                        What this tool does
                      </p>
                      <p className="mt-1 leading-relaxed text-zinc-500">{lesson.teaches}</p>
                    </div>

                    <div>
                      <p className="flex items-center gap-1 font-medium text-zinc-300">
                        <KeyRound className="h-3 w-3 text-violet-400" />
                        Keywords
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {lesson.keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 font-medium text-zinc-300">Quick tips</p>
                      <ul className="list-inside list-disc space-y-0.5 text-zinc-500">
                        {lesson.tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1.5 flex items-center gap-1 font-medium text-zinc-300">
                        <BookOpen className="h-3 w-3" />
                        Visual cheat sheet
                      </p>
                      <Diagram />
                    </div>

                    <div className="flex gap-2 border-t border-white/5 pt-2">
                      {prv ? (
                        <Link
                          href={`/training/${prv.id}`}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300"
                        >
                          ← {prv.title}
                        </Link>
                      ) : null}
                      <span className="flex-1" />
                      {nxt ? (
                        <Link
                          href={`/training/${nxt.id}`}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300"
                        >
                          {nxt.title} →
                        </Link>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCoachExpanded(true)}
                    className="w-full rounded-lg border border-white/10 py-1.5 text-[11px] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  >
                    More tips, keywords & diagram ↓
                  </button>
                )}
              </div>
            </div>
          )}

          {celebrated && progress.complete ? (
            <div className="pointer-events-none absolute right-3 top-3 z-20">
              <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200 shadow-lg backdrop-blur">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Lesson saved
              </div>
            </div>
          ) : null}
        </div>

        <AttributesPanel
          nodeId={selectedId && selectedId !== HINT_NODE_ID ? selectedId : null}
          data={selectedData}
          onChange={onAttributeChange}
          onDelete={onDeleteNode}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}

export function TrainingWorkspace({ lesson }: { lesson: TrainingLesson }) {
  return (
    <ReactFlowProvider>
      <TrainingInner lesson={lesson} />
    </ReactFlowProvider>
  );
}
