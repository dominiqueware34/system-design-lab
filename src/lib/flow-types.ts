/** Animated data-flow playback types (see docs/specs/animated-data-flow.md) */

export type FlowPacketKind = "request" | "response" | "event" | "error";

/** Hand-authored hop: references stable node ids (guided builds) */
export interface FlowHopSpec {
  from: string;
  to: string;
  caption: string;
  durationMs?: number;
  dwellMs?: number;
}

/** Hand-authored scenario on a GuidedBuild */
export interface FlowScenarioSpec {
  id: string;
  name: string;
  description?: string;
  hops: FlowHopSpec[];
  packetLabel?: string;
  packetKind?: FlowPacketKind;
}

/** Runtime hop after resolving edge ids against the live graph */
export interface FlowHop {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  durationMs: number;
  caption: string;
  nodeDwellMs?: number;
  highlightNodeIds?: string[];
}

export interface FlowScenario {
  id: string;
  name: string;
  description: string;
  hops: FlowHop[];
  packetLabel?: string;
  packetKind?: FlowPacketKind;
  /** Optional second concurrent packet (v1: unused / P3) */
  parallel?: FlowScenario[];
}

export type PlaybackStatus = "idle" | "playing" | "paused" | "done";

export type PlaybackState =
  | { status: "idle" }
  | { status: "playing"; scenarioId: string; hopIndex: number; startedAt: number }
  | { status: "paused"; scenarioId: string; hopIndex: number; t: number }
  | { status: "done"; scenarioId: string };

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export const FLOW_SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

export const DEFAULT_HOP_MS = 900;
export const DEFAULT_DWELL_MS = 400;

export const PACKET_COLORS: Record<FlowPacketKind, string> = {
  request: "#38bdf8",
  response: "#34d399",
  event: "#a78bfa",
  error: "#f87171",
};
