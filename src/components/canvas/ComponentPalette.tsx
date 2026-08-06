"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  COMPONENT_CATALOG,
} from "@/lib/component-catalog";
import { ComponentIcon } from "@/components/icons";
import type { ComponentDefinition } from "@/lib/types";

export function ComponentPalette() {
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>("edge");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? COMPONENT_CATALOG.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.type.includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.category.includes(q)
        )
      : COMPONENT_CATALOG;

    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: filtered.filter((c) => c.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const onDragStart = (event: React.DragEvent, component: ComponentDefinition) => {
    event.dataTransfer.setData("application/system-design-component", component.type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-zinc-950/80">
      <div className="border-b border-white/10 p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Components
        </h2>
        <p className="mt-1 text-[11px] text-zinc-600">Drag onto the canvas</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-sky-500/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {grouped.map((group) => {
          const open = openCategory === group.category || !!query;
          return (
            <div key={group.category} className="mb-2">
              <button
                type="button"
                onClick={() =>
                  setOpenCategory((c) => (c === group.category ? null : group.category))
                }
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              >
                <span>{group.label}</span>
                <span className="text-zinc-600">{group.items.length}</span>
              </button>
              {open ? (
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      className="flex cursor-grab items-start gap-2 rounded-lg border border-transparent bg-zinc-900/60 px-2 py-2 active:cursor-grabbing hover:border-white/10 hover:bg-zinc-900"
                      title={item.description}
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${item.color}22`,
                          color: item.color,
                        }}
                      >
                        <ComponentIcon name={item.icon} className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                        <p className="line-clamp-2 text-[10px] leading-snug text-zinc-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
