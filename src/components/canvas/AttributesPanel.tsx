"use client";

import { getComponentByType } from "@/lib/component-catalog";
import type { AttributeValue, DesignNodeData } from "@/lib/types";
import { Trash2, X } from "lucide-react";

interface AttributesPanelProps {
  nodeId: string | null;
  data: DesignNodeData | null;
  onChange: (nodeId: string, attributes: Record<string, AttributeValue>, label?: string) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function AttributesPanel({
  nodeId,
  data,
  onChange,
  onDelete,
  onClose,
}: AttributesPanelProps) {
  if (!nodeId || !data) {
    return (
      <aside className="flex h-full w-72 shrink-0 flex-col border-l border-white/10 bg-zinc-950/80">
        <div className="border-b border-white/10 p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Attributes
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-600">
          Select a component on the canvas to edit its attributes
        </div>
      </aside>
    );
  }

  const definition = getComponentByType(data.componentType);

  const updateAttr = (key: string, value: AttributeValue) => {
    onChange(nodeId, { ...data.attributes, [key]: value });
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-white/10 bg-zinc-950/80">
      <div className="flex items-start justify-between border-b border-white/10 p-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Attributes
          </h2>
          <p className="mt-1 text-sm font-medium text-zinc-100">{data.label}</p>
          <p className="text-[11px] text-zinc-500">{data.componentType}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-zinc-500">Label</span>
          <input
            value={data.label}
            onChange={(e) => onChange(nodeId, data.attributes, e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
          />
        </label>

        {definition?.attributes.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-[11px] font-medium text-zinc-500">
              {field.label}
              {field.type === "number" && "unit" in field && field.unit
                ? ` (${field.unit})`
                : ""}
            </span>
            {field.type === "select" ? (
              <select
                value={String(data.attributes[field.key] ?? field.defaultValue)}
                onChange={(e) => updateAttr(field.key, e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : null}
            {field.type === "number" ? (
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={Number(data.attributes[field.key] ?? field.defaultValue)}
                onChange={(e) => updateAttr(field.key, Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
              />
            ) : null}
            {field.type === "boolean" ? (
              <button
                type="button"
                onClick={() =>
                  updateAttr(
                    field.key,
                    !(data.attributes[field.key] ?? field.defaultValue)
                  )
                }
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-sm ${
                  data.attributes[field.key]
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-zinc-900 text-zinc-400"
                }`}
              >
                <span>{data.attributes[field.key] ? "Enabled" : "Disabled"}</span>
                <span
                  className={`h-4 w-7 rounded-full p-0.5 transition ${
                    data.attributes[field.key] ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`block h-3 w-3 rounded-full bg-white transition ${
                      data.attributes[field.key] ? "translate-x-3" : ""
                    }`}
                  />
                </span>
              </button>
            ) : null}
            {field.type === "text" ? (
              <input
                type="text"
                value={String(data.attributes[field.key] ?? field.defaultValue)}
                onChange={(e) => updateAttr(field.key, e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
              />
            ) : null}
          </label>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => onDelete(nodeId)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Remove component
        </button>
      </div>
    </aside>
  );
}
