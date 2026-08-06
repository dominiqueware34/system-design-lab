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
import { ArrowLeft, Eraser, Loader2, Send } from "lucide-react";
import { ComponentPalette } from "./ComponentPalette";
import { AttributesPanel } from "./AttributesPanel";
import { ProblemPanel } from "./ProblemPanel";
import { EvaluationPanel } from "./EvaluationPanel";
import { DesignNode } from "./DesignNode";
import {
  defaultAttributes,
  getComponentByType,
} from "@/lib/component-catalog";
import { serializeDesign } from "@/lib/serialize-design";
import type {
  AttributeValue,
  DesignNodeData,
  DesignProblem,
  EvaluationResult,
  FollowUpChallenge,
} from "@/lib/types";

const nodeTypes = { design: DesignNode };

interface DesignWorkspaceProps {
  problem: DesignProblem;
}

function DesignWorkspaceInner({ problem }: DesignWorkspaceProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DesignNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [evalOpen, setEvalOpen] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<FollowUpChallenge | null>(null);
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);

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
        if (!res.ok) {
          throw new Error(data.error || "Evaluation failed");
        }

        const result = data as EvaluationResult;
        setEvaluation(result);

        const historyEntry = [
          {
            role: "user",
            content: isFollowUpFix
              ? `Submitted fix for: ${activeFollowUp?.question ?? "follow-up"}\nDesign: ${JSON.stringify(design)}`
              : `Submitted design: ${JSON.stringify(design)}`,
          },
          {
            role: "assistant",
            content: `Score ${result.score}. ${result.summary}${
              result.followUp ? ` Follow-up: ${result.followUp.question}` : ""
            }`,
          },
        ];
        setHistory((h) => [...h, ...historyEntry]);

        if (result.followUp && !result.isComplete) {
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
    [nodes, edges, problem, activeFollowUp, history]
  );

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Problems
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <p className="text-sm font-semibold">{problem.title}</p>
            <p className="text-[11px] capitalize text-zinc-500">{problem.difficulty}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-zinc-600 sm:inline">
            {nodes.length} components · {edges.length} links
          </span>
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
            disabled={evalLoading}
            onClick={() => submitDesign(!!activeFollowUp)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {evalLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {activeFollowUp ? "Submit fix" : "Submit design"}
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

export function DesignWorkspace({ problem }: DesignWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <DesignWorkspaceInner problem={problem} />
    </ReactFlowProvider>
  );
}
