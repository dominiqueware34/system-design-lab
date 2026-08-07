export type Difficulty = "easy" | "medium" | "hard";

export type ComponentCategory =
  | "client"
  | "edge"
  | "compute"
  | "data"
  | "messaging"
  | "security"
  | "observability"
  | "storage";

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
  other?: string[];
}

export interface DesignProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
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
}

export interface EvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  dimensions: {
    latency: DimensionScore;
    redundancy: DimensionScore;
    scale: DimensionScore;
    correctness: DimensionScore;
  };
  followUp: FollowUpChallenge | null;
  isComplete: boolean;
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

export interface ChatMessage {
  role: "assistant" | "user" | "system";
  content: string;
  kind?: "evaluation" | "followup" | "response";
  evaluation?: EvaluationResult;
}
