"use client";

import { memo } from "react";
import { MapPin } from "lucide-react";

export type HintNodeData = {
  label: string;
  sublabel?: string;
  [key: string]: unknown;
};

function HintNodeComponent({ data }: { data: HintNodeData }) {
  return (
    <div className="pointer-events-none w-[168px] select-none">
      <div className="relative rounded-xl border-2 border-dashed border-sky-400/70 bg-sky-500/15 px-3 py-3 text-center shadow-[0_0_24px_rgba(56,189,248,0.35)]">
        <span className="absolute -top-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-950">
          <MapPin className="h-2.5 w-2.5" />
          Drop here
        </span>
        <p className="mt-1 text-xs font-semibold text-sky-100">{data.label}</p>
        {data.sublabel ? (
          <p className="mt-1 text-[10px] leading-snug text-sky-200/70">{data.sublabel}</p>
        ) : null}
        <div className="mx-auto mt-2 h-2 w-2 animate-ping rounded-full bg-sky-400" />
      </div>
    </div>
  );
}

export const HintNode = memo(HintNodeComponent);
