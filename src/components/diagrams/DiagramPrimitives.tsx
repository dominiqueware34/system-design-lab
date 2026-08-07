import type { ReactNode } from "react";

/** Shared visual primitives for training infographic SVGs */

export function SoftCard({
  x,
  y,
  w,
  h,
  fill = "#1e293b",
  stroke = "#334155",
  r = 10,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  r?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = "#94a3b8",
  dashed = false,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
  label?: string;
}) {
  const id = `arr-${x1}-${y1}-${x2}-${y2}`.replace(/\./g, "");
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <defs>
        <marker
          id={id}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={1.75}
        strokeDasharray={dashed ? "5 4" : undefined}
        markerEnd={`url(#${id})`}
      />
      {label ? (
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fill="#64748b"
          fontSize={9}
          fontFamily="system-ui,sans-serif"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function IconCircle({
  cx,
  cy,
  r = 16,
  fill,
  stroke,
  children,
}: {
  cx: number;
  cy: number;
  r?: number;
  fill: string;
  stroke?: string;
  children?: ReactNode;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke ?? fill}
        strokeWidth={1.5}
      />
      {children}
    </g>
  );
}

export function Caption({
  x,
  y,
  children,
  size = 11,
  fill = "#e2e8f0",
  anchor = "middle",
  weight = 600,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      fontSize={size}
      fontWeight={weight}
      fontFamily="system-ui,sans-serif"
    >
      {children}
    </text>
  );
}

export function DiagramFrame({
  title,
  children,
  width = 480,
  height = 220,
}: {
  title?: string;
  children: ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]">
      {title ? (
        <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold tracking-wide text-sky-300">
          {title}
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={title ?? "Architecture diagram"}
      >
        <rect width={width} height={height} fill="#0f172a" />
        {children}
      </svg>
    </div>
  );
}
