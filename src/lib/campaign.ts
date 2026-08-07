import type { CampaignLevelNode, CampaignProgress } from "./types";
import { getProblemById } from "./problems";

/**
 * Zelda / Mario-style campaign path.
 * Coordinates are % of the map canvas (x left→right, y top→bottom).
 * Path winds through worlds of increasing difficulty.
 */
export const CAMPAIGN_LEVELS: CampaignLevelNode[] = [
  // World 1 — The Threshold
  {
    id: "w1-l1",
    problemId: "url-shortener",
    mapLabel: "Tiny Links",
    world: 1,
    worldName: "The Threshold",
    x: 8,
    y: 72,
    unlocksAfter: [],
    wrenchCount: 1,
    passScore: 55,
    flavor: "Your first production deploy. Keep it short. Keep it up.",
  },
  {
    id: "w1-l2",
    problemId: "rate-limiter-service",
    mapLabel: "Gatekeeper",
    world: 1,
    worldName: "The Threshold",
    x: 18,
    y: 58,
    unlocksAfter: ["w1-l1"],
    wrenchCount: 1,
    passScore: 55,
    flavor: "Bots at the gate. You hold the keys.",
  },
  {
    id: "w1-l3",
    problemId: "distributed-kv",
    mapLabel: "Hash Ring",
    world: 1,
    worldName: "The Threshold",
    x: 28,
    y: 70,
    unlocksAfter: ["w1-l2"],
    wrenchCount: 1,
    passScore: 58,
    flavor: "Find the data. Survive the rebalance.",
  },
  // World 2 — Scaling Frontier
  {
    id: "w2-l1",
    problemId: "chat-system",
    mapLabel: "Live Wire",
    world: 2,
    worldName: "Scaling Frontier",
    x: 38,
    y: 48,
    unlocksAfter: ["w1-l3"],
    wrenchCount: 1,
    passScore: 60,
    flavor: "Messages don't wait. Neither do users.",
  },
  {
    id: "w2-l2",
    problemId: "global-id-generator",
    mapLabel: "Snowflake Falls",
    world: 2,
    worldName: "Scaling Frontier",
    x: 48,
    y: 38,
    unlocksAfter: ["w2-l1"],
    wrenchCount: 1,
    passScore: 60,
    flavor: "Billions of IDs. Zero collisions. No excuses.",
  },
  {
    id: "w2-l3",
    problemId: "news-feed",
    mapLabel: "Feed Frenzy",
    world: 2,
    worldName: "Scaling Frontier",
    x: 58,
    y: 50,
    unlocksAfter: ["w2-l2"],
    wrenchCount: 2,
    passScore: 62,
    flavor: "One post. A million timelines. Don't melt.",
  },
  {
    id: "w2-l4",
    problemId: "ride-sharing",
    mapLabel: "Geo Match",
    world: 2,
    worldName: "Scaling Frontier",
    x: 68,
    y: 36,
    unlocksAfter: ["w2-l3"],
    wrenchCount: 2,
    passScore: 62,
    flavor: "Riders, drivers, maps, mayhem.",
  },
  // World 3 — Agentic Frontier
  {
    id: "w3-l1",
    problemId: "rag-support-agent",
    mapLabel: "RAG Ruins",
    world: 3,
    worldName: "Agentic Frontier",
    x: 72,
    y: 58,
    unlocksAfter: ["w2-l4"],
    wrenchCount: 1,
    passScore: 60,
    flavor: "Answers are buried. Dig carefully.",
  },
  {
    id: "w3-l2",
    problemId: "research-agent-web",
    mapLabel: "Web Scout",
    world: 3,
    worldName: "Agentic Frontier",
    x: 78,
    y: 72,
    unlocksAfter: ["w3-l1"],
    wrenchCount: 2,
    passScore: 62,
    flavor: "The open web is a tool and a trap.",
  },
  {
    id: "w3-l3",
    problemId: "parallel-research-team",
    mapLabel: "Agent Swarm",
    world: 3,
    worldName: "Agentic Frontier",
    x: 88,
    y: 58,
    unlocksAfter: ["w3-l2"],
    wrenchCount: 2,
    passScore: 65,
    flavor: "Parallel minds. One deadline.",
  },
  // World 4 — Endgame Spire
  {
    id: "w4-l1",
    problemId: "coding-agent-pr",
    mapLabel: "Code Crucible",
    world: 4,
    worldName: "Endgame Spire",
    x: 86,
    y: 38,
    unlocksAfter: ["w3-l3"],
    wrenchCount: 2,
    passScore: 65,
    flavor: "Agents that write code must survive review.",
  },
  {
    id: "w4-l2",
    problemId: "payment-system",
    mapLabel: "Ledger Labyrinth",
    world: 4,
    worldName: "Endgame Spire",
    x: 74,
    y: 22,
    unlocksAfter: ["w4-l1"],
    wrenchCount: 2,
    passScore: 68,
    flavor: "Money moves once — or not at all.",
  },
  {
    id: "w4-l3",
    problemId: "video-streaming",
    mapLabel: "Global Stream",
    world: 4,
    worldName: "Endgame Spire",
    x: 58,
    y: 18,
    unlocksAfter: ["w4-l2"],
    wrenchCount: 2,
    passScore: 70,
    flavor: "The world hits play at once.",
  },
  {
    id: "w4-l4",
    problemId: "enterprise-agent-platform",
    mapLabel: "Agent OS",
    world: 4,
    worldName: "Endgame Spire",
    x: 42,
    y: 14,
    unlocksAfter: ["w4-l3"],
    wrenchCount: 2,
    passScore: 70,
    flavor: "Every agent's runtime. Every tenant's rules.",
  },
  {
    id: "w4-l5",
    problemId: "eval-driven-agent-improvement",
    mapLabel: "Eval Peak",
    world: 4,
    worldName: "Endgame Spire",
    x: 26,
    y: 12,
    unlocksAfter: ["w4-l4"],
    wrenchCount: 2,
    passScore: 72,
    flavor: "The final boss: measure everything.",
  },
];

export const CAMPAIGN_PATHS: Array<{ from: string; to: string }> = CAMPAIGN_LEVELS.flatMap(
  (level) => level.unlocksAfter.map((from) => ({ from, to: level.id }))
);

export function getCampaignLevel(id: string): CampaignLevelNode | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

export function getCampaignLevelForProblem(
  problemId: string
): CampaignLevelNode | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.problemId === problemId);
}

const STORAGE_KEY = "sdl-campaign-progress-v1";

export function defaultProgress(): CampaignProgress {
  return {
    completedLevelIds: [],
    stars: {},
    wrenchesSurvived: 0,
  };
}

export function loadProgress(): CampaignProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as CampaignProgress;
    return {
      ...defaultProgress(),
      ...parsed,
      completedLevelIds: parsed.completedLevelIds ?? [],
      stars: parsed.stars ?? {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: CampaignProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isLevelUnlocked(
  level: CampaignLevelNode,
  progress: CampaignProgress
): boolean {
  if (level.unlocksAfter.length === 0) return true;
  return level.unlocksAfter.every((id) => progress.completedLevelIds.includes(id));
}

export function isLevelCompleted(
  levelId: string,
  progress: CampaignProgress
): boolean {
  return progress.completedLevelIds.includes(levelId);
}

export function markLevelComplete(
  levelId: string,
  score: number,
  passScore: number,
  wrenchesThisLevel: number
): CampaignProgress {
  const progress = loadProgress();
  if (!progress.completedLevelIds.includes(levelId)) {
    progress.completedLevelIds.push(levelId);
  }
  // Stars: 1 pass, 2 if score well above pass, 3 if excellent
  let stars = 1;
  if (score >= passScore + 15) stars = 2;
  if (score >= passScore + 25) stars = 3;
  progress.stars[levelId] = Math.max(progress.stars[levelId] ?? 0, stars);
  progress.wrenchesSurvived += wrenchesThisLevel;
  progress.lastPlayedLevelId = levelId;
  saveProgress(progress);
  return progress;
}

export function campaignHref(levelId: string): string {
  const level = getCampaignLevel(levelId);
  if (!level) return "/campaign";
  return `/design/${level.problemId}?campaign=${levelId}`;
}

export function worlds(): Array<{ world: number; name: string; levels: CampaignLevelNode[] }> {
  const map = new Map<number, CampaignLevelNode[]>();
  for (const level of CAMPAIGN_LEVELS) {
    const list = map.get(level.world) ?? [];
    list.push(level);
    map.set(level.world, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([world, levels]) => ({
      world,
      name: levels[0]?.worldName ?? `World ${world}`,
      levels,
    }));
}

export function resolveLevelProblem(level: CampaignLevelNode) {
  return getProblemById(level.problemId);
}
