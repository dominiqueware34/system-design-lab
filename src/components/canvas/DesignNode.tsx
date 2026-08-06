"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ComponentIcon } from "@/components/icons";
import type { DesignNodeData } from "@/lib/types";

function DesignNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as DesignNodeData;
  const attrPreview = Object.entries(nodeData.attributes)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");

  return (
    <div
      className={`min-w-[160px] max-w-[200px] rounded-xl border bg-zinc-900/95 shadow-lg backdrop-blur transition ${
        selected
          ? "border-white/40 ring-2 ring-sky-500/50"
          : "border-white/10 hover:border-white/25"
      }`}
      style={{ boxShadow: `0 0 0 1px ${nodeData.color}22, 0 8px 24px rgba(0,0,0,0.35)` }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-zinc-900 !bg-zinc-300"
      />
      <div
        className="flex items-center gap-2 rounded-t-xl px-3 py-2"
        style={{ backgroundColor: `${nodeData.color}22` }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${nodeData.color}33`, color: nodeData.color }}
        >
          <ComponentIcon name={nodeData.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100">{nodeData.label}</p>
          <p className="truncate text-[10px] uppercase tracking-wide text-zinc-500">
            {nodeData.category}
          </p>
        </div>
      </div>
      {attrPreview ? (
        <p className="truncate border-t border-white/5 px-3 py-1.5 text-[10px] text-zinc-500">
          {attrPreview}
        </p>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-zinc-900 !bg-zinc-300"
      />
    </div>
  );
}

export const DesignNode = memo(DesignNodeComponent);
