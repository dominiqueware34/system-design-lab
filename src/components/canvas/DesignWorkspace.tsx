"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eraser, Loader2, Send, Swords, Waypoints } from "lucide-react";
import { ComponentPalette } from "./ComponentPalette";
import { AttributesPanel } from "./AttributesPanel";
import { ProblemPanel } from "./ProblemPanel";
import { EvaluationPanel } from "./EvaluationPanel";
import { DesignNode } from "./DesignNode";
import { DataFlowPlayer } from "@/components/flow/DataFlowPlayer";
import { WrenchPanel } from "@/components/campaign/WrenchPanel";
import {
  defaultAttributes,
  getComponentByType,
} from "@/lib/component-catalog";
import { buildHeuristicScenarios } from "@/lib/flow-scenarios";
import { serializeDesign } from "@/lib/serialize-design";
import { getCampaignLevel, markLevelComplete } from "@/lib/campaign";
import {
  getSoloLevel,
  getSoloLevelProblem,
  markSoloProblemComplete,
} from "@/lib/solo-levels";
import type {
  AttributeValue,
  CampaignLevelNode,
  CampaignPhase,
  DesignNodeData,
  DesignProblem,
  DesignWrench,
  EvaluationResult,
  FollowUpChallenge,
  SoloLevel,
} from "@/lib/types";

const nodeTypes = { design: DesignNode };

interface DesignWorkspaceProps {
  problem: DesignProblem;
  /** Multi-problem Solo Mode level id (e.g. solo-l1). No wrenches. */
  soloLevelId?: string;
  /** When set, run legacy map flow with AI wrenches */
  campaignLevelId?: string;
}

function DesignWorkspaceInner({
  problem,
  soloLevelId,
  campaignLevelId,
}: DesignWorkspaceProps) {
  const router = useRouter();
  const soloLevel: SoloLevel | undefined = soloLevelId
    ? getSoloLevel(soloLevelId)
    : undefined;
  const soloSlot = soloLevelId
    ? getSoloLevelProblem(soloLevelId, problem.id)
    : undefined;
  const isSolo = !!soloLevel && !!soloSlot;

  const campaignLevel: CampaignLevelNode | undefined = campaignLevelId
    ? getCampaignLevel(campaignLevelId)
    : undefined;
  /** Legacy wrench map only — never used for multi-problem Solo. */
  const isCampaign = !!campaignLevel && !isSolo;

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const soloStartedAt = useRef<number>(
    typeof performance !== "undefined" ? performance.now() : Date.now()
  );
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DesignNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Free practice + Solo evaluation state
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<FollowUpChallenge | null>(null);
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [soloPassed, setSoloPassed] = useState(false);

  // Campaign chaos state (legacy map)
  const [phase, setPhase] = useState<CampaignPhase>("design");
  const [wrenchOpen, setWrenchOpen] = useState(false);
  const [wrenchLoading, setWrenchLoading] = useState(false);
  const [wrenchError, setWrenchError] = useState<string | null>(null);
  const [activeWrench, setActiveWrench] = useState<DesignWrench | null>(null);
  const [previousWrenches, setPreviousWrenches] = useState<DesignWrench[]>([]);
  const [wrenchIndex, setWrenchIndex] = useState(0);
  const [fixFeedback, setFixFeedback] = useState<string | null>(null);
  const [levelPassed, setLevelPassed] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [flowOpen, setFlowOpen] = useState(false);

  const totalWrenches = campaignLevel?.wrenchCount ?? 1;
  const passScore = isSolo
    ? (soloSlot?.passScore ?? 60)
    : (campaignLevel?.passScore ?? 60);

  const flowScenarios = useMemo(
    () => buildHeuristicScenarios(nodes, edges),
    [nodes, edges]
  );
  const canPlayFlow =
    nodes.length >= 2 && edges.length >= 1 && flowScenarios.length > 0;

  const selectedData = useMemo(() => {
    if (!selectedId) return null;
    const node = nodes.find((n) => n.id === selectedId);
    return node?.data ?? null;
  }, [nodes, selectedId]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#71717a", strokeWidth: 1.5 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes: selected }: OnSelectionChangeParams) => {
    setSelectedId(selected[0]?.id ?? null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

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
      const newNode: Node<DesignNodeData> = {
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
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedId(id);
    },
    [screenToFlowPosition, setNodes]
  );

  const onAttributeChange = useCallback(
    (nodeId: string, attributes: Record<string, AttributeValue>, label?: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
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
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedId(null);
    },
    [setNodes, setEdges]
  );

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
  }, [setNodes, setEdges]);

  /** Free-practice + Solo Mode submit (evaluate API; no wrenches). */
  const submitDesign = useCallback(
    async (isFollowUpFix: boolean) => {
      if (nodes.length === 0) {
        setEvalOpen(true);
        setEvalError("Add at least one component to the canvas before submitting.");
        return;
      }

      const design = serializeDesign(nodes, edges);
      setEvalOpen(true);
      setEvalLoading(true);
      setEvalError(null);

      try {
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem,
            design,
            priorFollowUp: isFollowUpFix ? activeFollowUp : null,
            history,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Evaluation failed");

        const result = data as EvaluationResult;
        setEvaluation(result);
        setLastScore(result.score);

        setHistory((h) => [
          ...h,
          {
            role: "user",
            content: isFollowUpFix
              ? `Submitted fix for: ${activeFollowUp?.question ?? "follow-up"}`
              : "Submitted design",
          },
          {
            role: "assistant",
            content: `Score ${result.score}. ${result.summary}`,
          },
        ]);

        // Solo multi-problem: pass ≥ passScore writes progress + first-finish duration
        if (isSolo && soloLevelId && result.score >= passScore) {
          const now =
            typeof performance !== "undefined" ? performance.now() : Date.now();
          const durationMs = Math.max(0, Math.round(now - soloStartedAt.current));
          markSoloProblemComplete(
            soloLevelId,
            problem.id,
            result.score,
            passScore,
            durationMs
          );
          setSoloPassed(true);
        }

        if (result.followUp && !result.isComplete && !(isSolo && result.score >= passScore)) {
          setActiveFollowUp(result.followUp);
        } else {
          setActiveFollowUp(null);
        }
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
      } finally {
        setEvalLoading(false);
      }
    },
    [nodes, edges, problem, activeFollowUp, history, isSolo, soloLevelId, passScore]
  );

  /** Campaign: deploy design → AI throws wrench */
  const throwWrench = useCallback(async () => {
    if (nodes.length === 0) {
      setWrenchOpen(true);
      setWrenchError("Add at least one component before deploying.");
      return;
    }

    const design = serializeDesign(nodes, edges);
    setWrenchOpen(true);
    setWrenchLoading(true);
    setWrenchError(null);
    setFixFeedback(null);
    setPhase("wrench");

    try {
      const res = await fetch("/api/wrench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "throw",
          problem,
          design,
          wrenchIndex,
          totalWrenches,
          previousWrenches,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate wrench");

      const wrench = data as DesignWrench;
      setActiveWrench(wrench);
      setPhase("wrench");
    } catch (err) {
      setWrenchError(err instanceof Error ? err.message : "Wrench failed");
      setPhase("design");
    } finally {
      setWrenchLoading(false);
    }
  }, [nodes, edges, problem, wrenchIndex, totalWrenches, previousWrenches]);

  /** Campaign: submit fix for active wrench */
  const submitWrenchFix = useCallback(async () => {
    if (!activeWrench || !campaignLevel) return;
    if (nodes.length === 0) {
      setWrenchError("Your canvas is empty.");
      return;
    }

    const design = serializeDesign(nodes, edges);
    setWrenchLoading(true);
    setWrenchError(null);
    setPhase("fixing");
    setWrenchOpen(true);

    try {
      const res = await fetch("/api/wrench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate",
          problem,
          design,
          wrench: activeWrench,
          passScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fix evaluation failed");

      setLastScore(data.score ?? 0);
      setFixFeedback(data.feedback || data.summary);

      if (!data.addressed) {
        setPhase("wrench");
        setFixFeedback(
          (data.feedback || data.summary) +
            (data.remainingGaps?.length
              ? ` Still open: ${data.remainingGaps.slice(0, 2).join("; ")}`
              : " The wrench still hits your design — iterate and submit again.")
        );
        return;
      }

      // Wrench survived
      const nextIndex = wrenchIndex + 1;
      const survived = [...previousWrenches, activeWrench];
      setPreviousWrenches(survived);

      if (nextIndex < totalWrenches) {
        // More chaos coming
        setWrenchIndex(nextIndex);
        setActiveWrench(null);
        setFixFeedback(
          `Wrench cleared! Score ${data.score}. Preparing next chaos event…`
        );
        setWrenchLoading(true);
        const throwRes = await fetch("/api/wrench", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "throw",
            problem,
            design,
            wrenchIndex: nextIndex,
            totalWrenches,
            previousWrenches: survived,
          }),
        });
        const throwData = await throwRes.json();
        if (!throwRes.ok) throw new Error(throwData.error || "Next wrench failed");
        setActiveWrench(throwData as DesignWrench);
        setFixFeedback(null);
        setPhase("wrench");
        setWrenchLoading(false);
        return;
      }

      // Final: pass if addressed + passLevel or score threshold
      const canPass =
        data.passLevel === true || (data.addressed && (data.score ?? 0) >= passScore);

      if (canPass && campaignLevelId) {
        markLevelComplete(
          campaignLevelId,
          data.score ?? passScore,
          passScore,
          survived.length
        );
        setLevelPassed(true);
        setPhase("passed");
        setActiveWrench(null);
      } else {
        setPhase("wrench");
        setFixFeedback(
          data.feedback ||
            `Design improved but not enough to pass (need ~${passScore}+ and a solid fix). Keep hardening.`
        );
        // re-open last wrench
        setActiveWrench(activeWrench);
      }
    } catch (err) {
      setWrenchError(err instanceof Error ? err.message : "Fix evaluation failed");
      setPhase("wrench");
    } finally {
      setWrenchLoading(false);
    }
  }, [
    activeWrench,
    campaignLevel,
    campaignLevelId,
    nodes,
    edges,
    problem,
    passScore,
    wrenchIndex,
    totalWrenches,
    previousWrenches,
  ]);

  const primaryAction = () => {
    if (isSolo) {
      if (soloPassed) {
        router.push("/solo");
        return;
      }
      void submitDesign(!!activeFollowUp);
      return;
    }
    if (!isCampaign) {
      void submitDesign(!!activeFollowUp);
      return;
    }
    if (levelPassed) {
      router.push("/solo");
      return;
    }
    if (activeWrench && phase === "wrench") {
      void submitWrenchFix();
      return;
    }
    void throwWrench();
  };

  const primaryLabel = (() => {
    if (isSolo) {
      if (soloPassed) return "Back to Solo";
      return activeFollowUp ? "Submit fix" : "Submit design";
    }
    if (!isCampaign) return activeFollowUp ? "Submit fix" : "Submit design";
    if (levelPassed) return "Back to map";
    if (activeWrench && phase === "wrench") return "Submit wrench fix";
    if (phase === "design" || !activeWrench) return "Deploy — throw wrench";
    return "Submit";
  })();

if (flowOpen) {
    return (
      <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFlowOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit playback
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <p className="text-sm font-semibold">
                {isCampaign && campaignLevel
                  ? campaignLevel.mapLabel
                  : problem.title}
              </p>
              <p className="text-[11px] text-sky-400">
                Data flow playback{isSolo ? " · Solo" : ""}
              </p>
            </div>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <DataFlowPlayer
            nodes={nodes}
            edges={edges}
            scenarios={flowScenarios}
            defaultScenarioId={flowScenarios[0]?.id}
            autoplay
            readOnlyGraph
            onExit={() => setFlowOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <Link
            href={isSolo || isCampaign ? "/solo" : "/practice"}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {isSolo ? "Solo" : isCampaign ? "Map" : "Problems"}
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <p className="text-sm font-semibold">
              {isCampaign && campaignLevel
                ? `${campaignLevel.mapLabel}`
                : problem.title}
            </p>
            <p className="text-[11px] capitalize text-zinc-500">
              {isSolo
                ? `${soloLevel?.title ?? "Solo"} · pass ≥ ${passScore}${
                    soloPassed ? " · cleared" : ""
                  }`
                : isCampaign
                  ? `Legacy map · W${campaignLevel?.world} · ${phase}${
                      levelPassed ? " · cleared" : ""
                    }`
                  : problem.difficulty}
            </p>
          </div>
          {isSolo ? (
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 sm:inline-flex">
              Solo · no wrenches
            </span>
          ) : null}
          {isCampaign ? (
            <span className="hidden items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300 sm:inline-flex">
              <Swords className="h-3 w-3" />
              {wrenchIndex}/{totalWrenches} wrenches
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-zinc-600 sm:inline">
            {nodes.length} components · {edges.length} links
            {lastScore > 0 ? ` · last ${lastScore}` : ""}
          </span>
          {canPlayFlow ? (
            <button
              type="button"
              onClick={() => setFlowOpen(true)}
              title="Animate request paths on your graph"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-500/20"
            >
              <Waypoints className="h-3.5 w-3.5" />
              Play flow
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearCanvas}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            type="button"
            disabled={evalLoading || wrenchLoading}
            onClick={primaryAction}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${
              isCampaign
                ? "bg-rose-600 hover:bg-rose-500"
                : isSolo
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            {evalLoading || wrenchLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isCampaign ? (
              <Swords className="h-3.5 w-3.5" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {primaryLabel}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ComponentPalette />

        <div className="relative min-w-0 flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            proOptions={{ hideAttribution: true }}
            className="bg-zinc-950"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#71717a", strokeWidth: 1.5 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#27272a" />
            <Controls className="!border-white/10 !bg-zinc-900 !shadow-lg [&>button]:!border-white/10 [&>button]:!bg-zinc-900 [&>button]:!fill-zinc-300" />
            <MiniMap
              className="!border-white/10 !bg-zinc-900"
              nodeColor={(n) => (n.data as DesignNodeData)?.color ?? "#52525b"}
              maskColor="rgba(0,0,0,0.6)"
            />
          </ReactFlow>

          <ProblemPanel problem={problem} />

          {isCampaign && activeWrench && !wrenchOpen ? (
            <div className="absolute bottom-3 left-1/2 z-10 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-center shadow-xl backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                Active wrench · {activeWrench.category}
              </p>
              <p className="mt-1 text-sm text-zinc-100">{activeWrench.headline}</p>
              <button
                type="button"
                onClick={() => setWrenchOpen(true)}
                className="mt-2 text-xs text-rose-200 underline"
              >
                Show details
              </button>
            </div>
          ) : null}

          {isCampaign ? (
            <WrenchPanel
              open={wrenchOpen}
              loading={wrenchLoading}
              error={wrenchError}
              wrench={activeWrench}
              phase={phase}
              wrenchIndex={wrenchIndex}
              totalWrenches={totalWrenches}
              fixFeedback={fixFeedback}
              passed={levelPassed}
              onClose={() => setWrenchOpen(false)}
              onSubmitFix={() => void submitWrenchFix()}
              onContinueToMap={() => router.push("/solo")}
              onWatchFlow={
                canPlayFlow
                  ? () => {
                      setWrenchOpen(false);
                      setFlowOpen(true);
                    }
                  : undefined
              }
            />
          ) : (
            <>
              {isSolo && soloPassed && !evalOpen ? (
                <div className="absolute bottom-3 left-1/2 z-10 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-center shadow-xl backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Problem cleared · score {lastScore}
                  </p>
                  <p className="mt-1 text-sm text-zinc-100">
                    Progress saved. Finish every problem in the level to unlock the next.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/solo")}
                    className="mt-2 text-xs font-medium text-emerald-200 underline"
                  >
                    Back to Solo hub
                  </button>
                </div>
              ) : null}
              {activeFollowUp && !evalOpen ? (
                <div className="absolute bottom-3 left-1/2 z-10 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center shadow-xl backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                    Active challenge
                  </p>
                  <p className="mt-1 text-sm text-zinc-100">{activeFollowUp.question}</p>
                </div>
              ) : null}
              <EvaluationPanel
                open={evalOpen}
                loading={evalLoading}
                error={evalError}
                evaluation={evaluation}
                activeFollowUp={activeFollowUp}
                onClose={() => setEvalOpen(false)}
                onSubmitFix={() => submitDesign(true)}
                onDismissFollowUp={() => {
                  setActiveFollowUp(null);
                  setEvalOpen(false);
                }}
              />
            </>
          )}
        </div>

        <AttributesPanel
          nodeId={selectedId}
          data={selectedData}
          onChange={onAttributeChange}
          onDelete={onDeleteNode}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}

export function DesignWorkspace({
  problem,
  soloLevelId,
  campaignLevelId,
}: DesignWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <DesignWorkspaceInner
        problem={problem}
        soloLevelId={soloLevelId}
        campaignLevelId={campaignLevelId}
      />
    </ReactFlowProvider>
  );
}
