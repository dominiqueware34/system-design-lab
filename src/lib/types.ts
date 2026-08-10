export type Difficulty = "easy" | "medium" | "hard";

/** Classic infra vs agentic AI workflow design */
export type ProblemTrack = "classic" | "agentic";

export type ComponentCategory =
  | "client"
  | "edge"
  | "compute"
  | "data"
  | "messaging"
  | "security"
  | "observability"
  | "storage"
  | "agent"
  | "tools"
  | "memory"
  | "orchestration"
  | "evals";

export type AttributeField =
  | {
      key: string;
      label: string;
      type: "select";
      options: string[];
      defaultValue: string;
    }
  | {
      key: string;
      label: string;
      type: "number";
      min?: number;
      max?: number;
      unit?: string;
      defaultValue: number;
    }
  | {
      key: string;
      label: string;
      type: "boolean";
      defaultValue: boolean;
    }
  | {
      key: string;
      label: string;
      type: "text";
      defaultValue: string;
    };

export interface ComponentDefinition {
  type: string;
  label: string;
  category: ComponentCategory;
  description: string;
  color: string;
  icon: string;
  attributes: AttributeField[];
}

export type AttributeValue = string | number | boolean;

export interface DesignNodeData {
  componentType: string;
  label: string;
  category: ComponentCategory;
  color: string;
  icon: string;
  attributes: Record<string, AttributeValue>;
  [key: string]: unknown;
}

export interface SerializedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: DesignNodeData;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DesignGraph {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

export interface DesignConstraints {
  expectedQps?: string;
  latencySla?: string;
  availability?: string;
  dataVolume?: string;
  regions?: string;
  readWriteRatio?: string;
  consistency?: string;
  budget?: string;
  tokenBudget?: string;
  maxSteps?: string;
  other?: string[];
}

export interface DesignProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  track: ProblemTrack;
  summary: string;
  description: string;
  requirements: string[];
  constraints: DesignConstraints;
  evaluationFocus: string[];
  hints?: string[];
}

export interface DimensionScore {
  score: number;
  feedback: string;
}

export interface FollowUpChallenge {
  question: string;
  failureScenario: string;
  expectedFixHints: string[];
  relatedComponentTypes: string[];
  kind?: string;
}

export interface EvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  dimensions: {
    latency: DimensionScore;
    reliability: DimensionScore;
    scale: DimensionScore;
    correctness: DimensionScore;
    evaluation: DimensionScore;
  };
  followUp: FollowUpChallenge | null;
  isComplete: boolean;
}

/** Dynamic chaos event thrown at the player's design */
export type WrenchCategory =
  | "latency"
  | "security"
  | "capacity"
  | "failure"
  | "cost"
  | "data"
  | "evals"
  | "agent";

export interface DesignWrench {
  id: string;
  title: string;
  /** Short map/banner flavor */
  headline: string;
  category: WrenchCategory;
  severity: 1 | 2 | 3;
  /** Story of what just happened in production */
  narrative: string;
  /** Concrete impact metrics / symptoms */
  impact: string;
  /** Why this hits *their* design specifically */
  whyThisDesign: string;
  challengeQuestion: string;
  expectedFixHints: string[];
  relatedComponentTypes: string[];
}

export type CampaignPhase =
  | "design"
  | "wrench"
  | "fixing"
  | "passed"
  | "failed";

export interface CampaignLevelNode {
  id: string;
  /** References DesignProblem.id */
  problemId: string;
  /** Display name on the map (can differ slightly) */
  mapLabel: string;
  /** World / chapter grouping */
  world: number;
  worldName: string;
  /** Position on the campaign map (0–100 percent) */
  x: number;
  y: number;
  /** Level numbers that must be cleared first (campaign level ids) */
  unlocksAfter: string[];
  /** How many wrenches before a pass is allowed (1–2) */
  wrenchCount: number;
  /** Min overall score to pass after final fix */
  passScore: number;
  flavor?: string;
}

export interface CampaignProgress {
  completedLevelIds: string[];
  /** stars 0–3 per level */
  stars: Record<string, number>;
  /** total wrenches survived */
  wrenchesSurvived: number;
  lastPlayedLevelId?: string;
}

/** Per-problem Solo Mode progress (after a qualifying pass). */
export interface SoloProblemRecord {
  bestScore: number;
  /** 1–3 stars from score vs passScore */
  stars: number;
  /**
   * Wall-clock ms for the first qualifying finish.
   * 0 when seeded from legacy campaign map (unknown duration).
   */
  durationMs: number;
  completedAt?: string;
}

/**
 * Solo multi-problem progress (localStorage `sdl-solo-progress-v1` +
 * Supabase `solo_progress`). Completing one problem ≠ completing a level.
 */
export interface SoloProgress {
  /** problemId → best run */
  problems: Record<string, SoloProblemRecord>;
  /** Level ids where every problem in that level is completed */
  completedLevelIds: string[];
  lastPlayedLevelId?: string;
  lastPlayedProblemId?: string;
}

/** A problem slot inside a Solo multi-problem level. */
export interface SoloLevelProblemRef {
  problemId: string;
  /** Min evaluate score (0–100) to count as complete */
  passScore: number;
  order: number;
}

/** Solo Mode multi-problem level (data-driven; set will grow). */
export interface SoloLevel {
  id: string;
  title: string;
  description: string;
  track: ProblemTrack;
  /** Level ids that must be fully complete first */
  unlocksAfter: string[];
  problems: SoloLevelProblemRef[];
}

export interface ChatMessage {
  role: "assistant" | "user" | "system";
  content: string;
  kind?: "evaluation" | "followup" | "response";
  evaluation?: EvaluationResult;
}
