"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  X,
  Gauge,
} from "lucide-react";
import { DesignNode } from "@/components/canvas/DesignNode";
import type { DesignNodeData } from "@/lib/types";
import {
  FLOW_SPEEDS,
  PACKET_COLORS,
  type FlowHop,
  type FlowPacketKind,
  type FlowScenario,
  type PlaybackSpeed,
} from "@/lib/flow-types";

const nodeTypes = { design: DesignNode };

const DEFAULT_NODE_W = 180;
const DEFAULT_NODE_H = 72;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function cubicPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function nodeAnchor(
  node: Node<DesignNodeData>,
  side: "source" | "target"
): { x: number; y: number } {
  const w = (node.measured?.width ?? node.width ?? DEFAULT_NODE_W) as number;
  const h = (node.measured?.height ?? node.height ?? DEFAULT_NODE_H) as number;
  const x = node.position.x;
  const y = node.position.y;
  if (side === "source") {
    return { x: x + w, y: y + h / 2 };
  }
  return { x, y: y + h / 2 };
}

function edgeControls(
  from: Node<DesignNodeData> | undefined,
  to: Node<DesignNodeData> | undefined
) {
  if (!from || !to) return null;
  const s = nodeAnchor(from, "source");
  const t = nodeAnchor(to, "target");
  getBezierPath({
    sourceX: s.x,
    sourceY: s.y,
    targetX: t.x,
    targetY: t.y,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });
  const dx = Math.max(40, Math.abs(t.x - s.x) * 0.5);
  return {
    p0: { x: s.x, y: s.y },
    p1: { x: s.x + dx, y: s.y },
    p2: { x: t.x - dx, y: t.y },
    p3: { x: t.x, y: t.y },
  };
}

export type DataFlowPlayerProps = {
  nodes: Node<DesignNodeData>[];
  edges: Edge[];
  scenarios: FlowScenario[];
  defaultScenarioId?: string;
  autoplay?: boolean;
  readOnlyGraph?: boolean;
  onComplete?: () => void;
  onExit?: () => void;
  badge?: string;
};

type Phase = "idle" | "playing" | "paused" | "done";

/**
 * Animation clock state kept in refs for a single rAF loop:
 * hopIndex, t (0–1 on current edge), dwellRemainingMs (pause on node before moving).
 */
function DataFlowPlayerInner({
  nodes: inputNodes,
  edges: inputEdges,
  scenarios,
  defaultScenarioId,
  autoplay = false,
  onComplete,
  onExit,
  badge,
}: DataFlowPlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { fitView, getNodes } = useReactFlow();

  const initialScenarioId =
    defaultScenarioId && scenarios.some((s) => s.id === defaultScenarioId)
      ? defaultScenarioId
      : (scenarios[0]?.id ?? "");

  const [scenarioId, setScenarioId] = useState(initialScenarioId);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hopIndex, setHopIndex] = useState(0);
  const [t, setT] = useState(0);
  const [packetPos, setPacketPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [stepIndex, setStepIndex] = useState(0);

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const hops = scenario?.hops ?? [];
  const currentHop: FlowHop | undefined = hops[hopIndex];

  const clonedNodes = useMemo(
    (): Node<DesignNodeData>[] =>
      inputNodes.map((n) => ({
        ...n,
        data: { ...n.data },
        position: { ...n.position },
        selected: false,
        style: n.style ? { ...(n.style as CSSProperties) } : {},
      })),
    [inputNodes]
  );
  const clonedEdges = useMemo(
    (): Edge[] =>
      inputEdges.map((e) => ({
        ...e,
        style: { ...((e.style as CSSProperties | undefined) ?? {}) },
      })),
    [inputEdges]
  );

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<DesignNodeData>>(clonedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(clonedEdges);

  useEffect(() => {
    setNodes(clonedNodes.map((n) => ({ ...n, data: { ...n.data } })));
    setEdges(clonedEdges.map((e) => ({ ...e })));
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [clonedNodes, clonedEdges, setNodes, setEdges, fitView]);

  const activeEdgeId =
    phase === "idle" ? undefined : currentHop?.edgeId;
  const activeNodeIds = useMemo(() => {
    if (phase === "idle" || !currentHop) return new Set<string>();
    return new Set([
      currentHop.fromNodeId,
      currentHop.toNodeId,
      ...(currentHop.highlightNodeIds ?? []),
    ]);
  }, [currentHop, phase]);

  const dimGraph = phase !== "idle";

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const active = activeNodeIds.has(n.id);
        const opacity = !dimGraph ? 1 : active ? 1 : 0.4;
        const prevStyle = (n.style ?? {}) as CSSProperties;
        return {
          ...n,
          style: {
            ...prevStyle,
            opacity,
            transition: "opacity 200ms ease",
            boxShadow: active
              ? "0 0 0 2px #38bdf8, 0 0 16px rgba(56,189,248,0.45)"
              : undefined,
          },
        };
      })
    );
    setEdges((eds) =>
      eds.map((e) => {
        const active = e.id === activeEdgeId;
        const opacity = !dimGraph ? 1 : active ? 1 : 0.35;
        const prevStyle = (e.style ?? {}) as CSSProperties;
        return {
          ...e,
          animated: active && phase === "playing",
          style: {
            ...prevStyle,
            opacity,
            stroke: active ? "#38bdf8" : "#71717a",
            strokeWidth: active ? 2.5 : 1.5,
            transition: "opacity 200ms ease, stroke 200ms ease",
          },
        };
      })
    );
  }, [activeEdgeId, activeNodeIds, dimGraph, phase, setNodes, setEdges]);

  // ---- Animation engine (refs) ----
  // mode: 'travel' moves along edge; 'dwell' pauses at end of hop before advance
  const phaseRef = useRef(phase);
  const hopRef = useRef(hopIndex);
  const tRef = useRef(t);
  const speedRef = useRef(speed);
  const hopsRef = useRef(hops);
  const modeRef = useRef<"travel" | "dwell">("travel");
  const dwellLeftRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    hopRef.current = hopIndex;
  }, [hopIndex]);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    hopsRef.current = hops;
  }, [hops]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const placePacket = useCallback(
    (hop: FlowHop, progress: number) => {
      const live = getNodes() as Node<DesignNodeData>[];
      const from = live.find((n) => n.id === hop.fromNodeId);
      const to = live.find((n) => n.id === hop.toNodeId);
      const geo = edgeControls(from, to);
      if (!geo) {
        setPacketPos(null);
        return;
      }
      setPacketPos(cubicPoint(progress, geo.p0, geo.p1, geo.p2, geo.p3));
    },
    [getNodes]
  );

  const stopRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = null;
  };

  const markDone = useCallback(() => {
    stopRaf();
    setPhase("done");
    phaseRef.current = "done";
    setPacketPos(null);
    if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  }, []);

  const goToHop = useCallback(
    (index: number) => {
      const list = hopsRef.current;
      if (index >= list.length) {
        markDone();
        return;
      }
      hopRef.current = index;
      setHopIndex(index);
      tRef.current = 0;
      setT(0);
      modeRef.current = "travel";
      dwellLeftRef.current = 0;
      placePacket(list[index], 0);
    },
    [markDone, placePacket]
  );

  const runFrame = useCallback(
    (ts: number) => {
      if (phaseRef.current !== "playing") {
        lastTsRef.current = null;
        return;
      }
      if (document.visibilityState === "hidden") {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(runFrame);
        return;
      }

      const last = lastTsRef.current ?? ts;
      const dt = Math.min(64, ts - last);
      lastTsRef.current = ts;
      const scaledDt = dt * speedRef.current;

      const list = hopsRef.current;
      const hi = hopRef.current;
      const hop = list[hi];
      if (!hop) {
        markDone();
        return;
      }

      if (modeRef.current === "dwell") {
        dwellLeftRef.current -= scaledDt;
        placePacket(hop, 1);
        if (dwellLeftRef.current <= 0) {
          goToHop(hi + 1);
        }
        rafRef.current = requestAnimationFrame(runFrame);
        return;
      }

      // travel along edge
      const duration = Math.max(200, hop.durationMs);
      const nextT = Math.min(1, tRef.current + scaledDt / duration);
      tRef.current = nextT;
      setT(nextT);
      placePacket(hop, nextT);

      if (nextT >= 1) {
        const dwell = hop.nodeDwellMs ?? 0;
        if (dwell > 0) {
          modeRef.current = "dwell";
          dwellLeftRef.current = dwell;
        } else {
          goToHop(hi + 1);
        }
      }

      rafRef.current = requestAnimationFrame(runFrame);
    },
    [markDone, placePacket, goToHop]
  );

  useEffect(() => {
    if (reducedMotion) {
      stopRaf();
      return;
    }
    if (phase === "playing") {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(runFrame);
      return () => stopRaf();
    }
    stopRaf();
  }, [phase, runFrame, reducedMotion]);

  const startFromBeginning = useCallback(() => {
    if (!scenario || hops.length === 0) return;
    completedRef.current = false;
    hopsRef.current = hops;
    hopRef.current = 0;
    setHopIndex(0);
    tRef.current = 0;
    setT(0);
    setStepIndex(0);
    modeRef.current = "travel";
    dwellLeftRef.current = 0;
    placePacket(hops[0], 0);
    if (reducedMotion) {
      setPhase("paused");
      phaseRef.current = "paused";
      return;
    }
    setPhase("playing");
    phaseRef.current = "playing";
  }, [scenario, hops, placePacket, reducedMotion]);

  const play = useCallback(() => {
    if (!scenario || hops.length === 0) return;
    if (phase === "done" || phase === "idle") {
      startFromBeginning();
      return;
    }
    if (phase === "paused") {
      setPhase("playing");
      phaseRef.current = "playing";
    }
  }, [scenario, hops, phase, startFromBeginning]);

  const pause = useCallback(() => {
    if (phase === "playing") {
      setPhase("paused");
      phaseRef.current = "paused";
    }
  }, [phase]);

  const restart = useCallback(() => {
    stopRaf();
    setPhase("idle");
    phaseRef.current = "idle";
    setPacketPos(null);
    completedRef.current = false;
    // kick play next frame so state settles
    requestAnimationFrame(() => startFromBeginning());
  }, [startFromBeginning]);

  const onScenarioChange = (id: string) => {
    stopRaf();
    setScenarioId(id);
    setPhase("idle");
    phaseRef.current = "idle";
    setHopIndex(0);
    hopRef.current = 0;
    setT(0);
    tRef.current = 0;
    setStepIndex(0);
    setPacketPos(null);
    completedRef.current = false;
  };

  const didAutoplay = useRef(false);
  useEffect(() => {
    if (!autoplay || didAutoplay.current || scenarios.length === 0) return;
    didAutoplay.current = true;
    const timer = window.setTimeout(() => startFromBeginning(), 450);
    return () => clearTimeout(timer);
  }, [autoplay, scenarios.length, startFromBeginning]);

  const stepNext = () => {
    if (!scenario) return;
    if (stepIndex >= hops.length - 1) {
      setStepIndex(hops.length - 1);
      setHopIndex(hops.length - 1);
      markDone();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    setHopIndex(next);
    setPhase("paused");
  };

  const stepPrev = () => {
    const next = Math.max(0, stepIndex - 1);
    setStepIndex(next);
    setHopIndex(next);
    setPhase("paused");
  };

  const kind: FlowPacketKind = scenario?.packetKind ?? "request";
  const packetColor = PACKET_COLORS[kind];
  const caption = reducedMotion
    ? hops[stepIndex]?.caption
    : phase === "done"
      ? "Path complete"
      : (currentHop?.caption ?? "Ready to play");

  const playing = phase === "playing";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-zinc-950">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-zinc-950/95 px-3 py-2">
        <div className="flex items-center gap-2">
          {badge ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              {badge}
            </span>
          ) : null}
          <span className="text-xs font-medium text-zinc-300">Data flow</span>
          {scenarios.length > 1 ? (
            <select
              value={scenarioId}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-sky-500/50"
              aria-label="Scenario"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : scenario ? (
            <span className="text-xs text-zinc-500">{scenario.name}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Gauge className="h-3 w-3" />
            <select
              value={speed}
              onChange={(e) =>
                setSpeed(Number(e.target.value) as PlaybackSpeed)
              }
              className="rounded-md border border-white/10 bg-zinc-900 px-1.5 py-1 text-xs text-zinc-200"
              aria-label="Playback speed"
            >
              {FLOW_SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </label>
          {reducedMotion ? (
            <>
              <button
                type="button"
                onClick={stepPrev}
                disabled={stepIndex <= 0}
                className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={stepNext}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Next hop
              </button>
            </>
          ) : (
            <>
              {playing ? (
                <button
                  type="button"
                  onClick={pause}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={play}
                  disabled={hops.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                  {phase === "done"
                    ? "Replay"
                    : phase === "paused"
                      ? "Resume"
                      : "Play"}
                </button>
              )}
              <button
                type="button"
                onClick={restart}
                disabled={hops.length === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40"
                title="Restart"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            >
              <X className="h-3.5 w-3.5" />
              Exit
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          fitView
          proOptions={{ hideAttribution: true }}
          className="bg-zinc-950"
          defaultEdgeOptions={{
            animated: false,
            style: { stroke: "#71717a", strokeWidth: 1.5 },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1}
            color="#27272a"
          />
          <Controls className="!border-white/10 !bg-zinc-900 [&>button]:!border-white/10 [&>button]:!bg-zinc-900 [&>button]:!fill-zinc-300" />
        </ReactFlow>

        {!reducedMotion &&
        packetPos &&
        (playing || phase === "paused") ? (
          <PacketMarker
            x={packetPos.x}
            y={packetPos.y}
            color={packetColor}
            label={scenario?.packetLabel ?? "REQ"}
          />
        ) : null}

        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[min(520px,calc(100%-2rem))] -translate-x-1/2">
          <div
            className="rounded-xl border border-sky-500/30 bg-zinc-950/95 px-4 py-3 text-center shadow-2xl backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400">
              {scenario?.name ?? "Flow"}
              {hops.length > 0
                ? reducedMotion
                  ? ` · step ${stepIndex + 1}/${hops.length}`
                  : phase !== "idle"
                    ? ` · hop ${Math.min(hopIndex + 1, hops.length)}/${hops.length}`
                    : ""
                : ""}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {caption ?? "—"}
            </p>
            {scenario?.description && phase === "idle" ? (
              <p className="mt-1 text-[11px] text-zinc-500">
                {scenario.description}
              </p>
            ) : null}
          </div>
        </div>

        {reducedMotion && hops.length > 0 ? (
          <div className="absolute left-3 top-3 z-10 max-h-[50%] w-[min(280px,calc(100%-1.5rem))] overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-xl">
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Path steps
            </p>
            <ol className="space-y-0.5">
              {hops.map((h, i) => (
                <li key={`${h.edgeId}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setStepIndex(i);
                      setHopIndex(i);
                      setPhase("paused");
                    }}
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-[11px] leading-snug ${
                      i === stepIndex
                        ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-500/40"
                        : "text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="mr-1.5 font-mono text-[10px] text-zinc-600">
                      {i + 1}.
                    </span>
                    {h.caption}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PacketMarker({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  const { getViewport } = useReactFlow();
  const [screen, setScreen] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const update = () => {
      const vp = getViewport();
      setScreen({
        x: x * vp.zoom + vp.x,
        y: y * vp.zoom + vp.y,
      });
    };
    update();
    const id = window.setInterval(update, 32);
    return () => clearInterval(id);
  }, [x, y, getViewport]);

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: screen.x, top: screen.y }}
    >
      <div
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-zinc-950 shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}aa, 0 0 2px ${color}`,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-950/40" aria-hidden />
        {label}
      </div>
    </div>
  );
}

export function DataFlowPlayer(props: DataFlowPlayerProps) {
  if (!props.scenarios || props.scenarios.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
        <p className="text-sm text-zinc-400">
          Connect at least one path from a client to play data flow.
        </p>
        {props.onExit ? (
          <button
            type="button"
            onClick={props.onExit}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            Exit
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <DataFlowPlayerInner {...props} />
    </ReactFlowProvider>
  );
}
