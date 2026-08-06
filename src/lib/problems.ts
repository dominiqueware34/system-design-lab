import type { DesignProblem, Difficulty } from "./types";

export const PROBLEMS: DesignProblem[] = [
  {
    id: "url-shortener",
    title: "URL Shortener",
    difficulty: "easy",
    summary: "Design a service that shortens long URLs and redirects users quickly.",
    description:
      "Build a URL shortening service like bit.ly. Users submit a long URL and receive a short code. When someone visits the short link, they should be redirected to the original URL with low latency.",
    requirements: [
      "Create short URLs from long ones",
      "Redirect short URLs to original destinations",
      "Handle basic analytics (click counts) optionally",
      "Support custom aliases (nice-to-have)",
    ],
    constraints: {
      expectedQps: "1,000 write QPS / 10,000 read QPS",
      latencySla: "Redirect p99 < 100ms",
      availability: "99.9%",
      dataVolume: "~100M URLs stored",
      consistency: "Strong for create; eventual OK for analytics",
    },
    evaluationFocus: ["latency", "caching", "data model", "basic redundancy"],
    hints: [
      "Reads dominate writes — cache aggressively",
      "Hash or base62 encoding for short codes",
    ],
  },
  {
    id: "pastebin",
    title: "Pastebin",
    difficulty: "easy",
    summary: "Design a paste service for storing and sharing text snippets.",
    description:
      "Users paste text and get a unique link. Pastes can expire, be private or public, and should load quickly. Consider storage growth and expiration cleanup.",
    requirements: [
      "Create and retrieve text pastes",
      "Optional expiration (TTL)",
      "Public and unlisted pastes",
      "Reasonable size limits per paste",
    ],
    constraints: {
      expectedQps: "500 write / 5,000 read QPS",
      latencySla: "Read p99 < 200ms",
      availability: "99.9%",
      dataVolume: "10M pastes, avg 10KB each",
    },
    evaluationFocus: ["storage choice", "expiration", "latency", "simple scale-out"],
  },
  {
    id: "rate-limiter-service",
    title: "Distributed Rate Limiter",
    difficulty: "easy",
    summary: "Design a rate limiter used by other services at the edge.",
    description:
      "Other APIs call your service to check whether a client is allowed to proceed under a given quota (e.g. 100 req/min per user).",
    requirements: [
      "Support fixed-window or token-bucket algorithms",
      "Work across multiple API gateway instances",
      "Low added latency (< 5ms ideally)",
      "Configurable limits per key",
    ],
    constraints: {
      expectedQps: "50,000 check QPS",
      latencySla: "p99 < 10ms",
      availability: "99.99%",
      consistency: "Approximate limits acceptable under race conditions",
    },
    evaluationFocus: ["latency", "shared state", "in-memory cache", "failure modes"],
  },
  {
    id: "chat-system",
    title: "Real-time Chat",
    difficulty: "medium",
    summary: "Design a 1:1 and group chat system with online presence.",
    description:
      "Users send messages in real time, see online/offline status, and can participate in group chats. Messages should be durable and delivered reliably.",
    requirements: [
      "1:1 and group messaging",
      "Real-time delivery (WebSocket or similar)",
      "Message history and pagination",
      "Online presence indicators",
      "Read receipts (optional)",
    ],
    constraints: {
      expectedQps: "50,000 concurrent connections; 10k messages/sec peak",
      latencySla: "Message delivery p99 < 200ms",
      availability: "99.95%",
      dataVolume: "1B messages/year",
      consistency: "Causal ordering within a conversation preferred",
    },
    evaluationFocus: [
      "fan-out strategies",
      "connection management",
      "message durability",
      "scale of concurrent sockets",
      "redundancy of message brokers",
    ],
  },
  {
    id: "news-feed",
    title: "News Feed",
    difficulty: "medium",
    summary: "Design a social news feed with posts, follows, and ranking.",
    description:
      "Users follow others and see a personalized feed of posts. Feed generation can be push (fan-out on write), pull (fan-out on read), or hybrid. Rank posts for relevance and recency.",
    requirements: [
      "Create posts (text + media)",
      "Follow / unfollow users",
      "Generate personalized home feed",
      "Support media attachments via object storage/CDN",
      "Handle celebrity accounts with millions of followers",
    ],
    constraints: {
      expectedQps: "10k post writes / 100k feed reads QPS peak",
      latencySla: "Feed load p99 < 300ms",
      availability: "99.95%",
      dataVolume: "500M users, 200M DAU",
      readWriteRatio: "100:1 reads to writes on feed",
    },
    evaluationFocus: [
      "fan-out hybrid strategy",
      "caching",
      "CDN for media",
      "ranking pipeline",
      "hot key / celebrity problem",
    ],
  },
  {
    id: "ride-sharing",
    title: "Ride Sharing Matching",
    difficulty: "medium",
    summary: "Match riders with nearby drivers in real time.",
    description:
      "Riders request a trip; the system finds nearby available drivers, estimates ETA, and tracks the trip. Location updates stream continuously. Design for city-scale load with low matching latency.",
    requirements: [
      "Driver location updates in near real time",
      "Match rider to nearby driver",
      "Trip lifecycle (requested → matched → in-progress → complete)",
      "Pricing estimate based on distance/time",
      "Handle driver disconnects gracefully",
    ],
    constraints: {
      expectedQps: "5,000 location updates/sec per city; 200 matches/sec peak",
      latencySla: "Match decision p99 < 1s",
      availability: "99.9%",
      regions: "Multi-city, single-region per city initially",
      dataVolume: "Geo queries over ~50k active drivers/city",
    },
    evaluationFocus: [
      "geo-indexing",
      "streaming locations",
      "matching service reliability",
      "failure of matching node",
      "scale per city",
    ],
  },
  {
    id: "video-streaming",
    title: "Video Streaming Platform",
    difficulty: "hard",
    summary: "Design a Netflix-like on-demand video streaming system.",
    description:
      "Users browse a catalog and stream videos at adaptive bitrates worldwide. Videos are uploaded, transcoded into multiple qualities, stored, and delivered via CDN. Recommendations personalize the home screen.",
    requirements: [
      "Video upload and multi-bitrate transcoding",
      "Global low-latency streaming via CDN",
      "Adaptive bitrate playback",
      "Catalog search and metadata",
      "Personalized recommendations",
      "Handle regional rights / geo-restrictions",
    ],
    constraints: {
      expectedQps: "1M concurrent streams globally",
      latencySla: "Playback start < 2s; rebuffer rate < 0.5%",
      availability: "99.99%",
      dataVolume: "Petabytes of video assets",
      regions: "Multi-region active-active for metadata; CDN global",
      budget: "Storage and egress cost-aware",
    },
    evaluationFocus: [
      "CDN + origin design",
      "transcoding pipeline",
      "object storage durability",
      "multi-region metadata",
      "recommendation path latency",
      "redundancy and disaster recovery",
    ],
  },
  {
    id: "payment-system",
    title: "Payment Processing Platform",
    difficulty: "hard",
    summary: "Design a reliable payment system for merchants and consumers.",
    description:
      "Merchants accept card payments. The system authorizes charges, handles captures/refunds, webhooks to merchants, and ledger integrity. Correctness and auditability matter as much as scale.",
    requirements: [
      "Authorize, capture, and refund payments",
      "Idempotent payment APIs",
      "Double-entry ledger for balances",
      "Merchant webhooks with retries",
      "Fraud checks (basic)",
      "PCI-aware architecture (tokenize card data)",
    ],
    constraints: {
      expectedQps: "5,000 TPS peak",
      latencySla: "Authorize p99 < 500ms",
      availability: "99.99%",
      consistency: "Strong consistency for money movement",
      other: ["Exactly-once effects for money", "Full audit trail"],
    },
    evaluationFocus: [
      "idempotency",
      "ledger correctness",
      "queue-based webhooks",
      "redundancy of payment path",
      "failure recovery",
      "security isolation",
    ],
  },
  {
    id: "multiplayer-game",
    title: "Multiplayer Game Backend",
    difficulty: "hard",
    summary: "Design a real-time multiplayer game session backend.",
    description:
      "Players join matchmaking, enter game sessions with low-latency state sync, and need authoritative servers. Design for tick rates, state replication, and reconnection after disconnects.",
    requirements: [
      "Matchmaking queues by skill/region",
      "Authoritative game servers",
      "Low-latency state sync to clients",
      "Reconnect / session recovery",
      "Leaderboards and match history",
      "Anti-cheat hooks (basic)",
    ],
    constraints: {
      expectedQps: "100k concurrent players; 10k matches concurrent",
      latencySla: "Game tick / state update p99 < 50ms in-region",
      availability: "99.9% for matchmaking; graceful degrade for games",
      regions: "Multi-region game server fleets",
      consistency: "Authoritative server state; eventual for leaderboards",
    },
    evaluationFocus: [
      "regional placement for latency",
      "session affinity / sticky routing",
      "redundancy of matchmaking",
      "state persistence on crash",
      "scale of game server fleet",
    ],
  },
];

export function getProblemById(id: string): DesignProblem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

export function getProblemsByDifficulty(difficulty: Difficulty): DesignProblem[] {
  return PROBLEMS.filter((p) => p.difficulty === difficulty);
}

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; description: string; color: string }
> = {
  easy: {
    label: "Easy",
    description: "Single-service designs. Focus on correct data path, caching, and basic HA.",
    color: "text-emerald-400",
  },
  medium: {
    label: "Medium",
    description: "Multi-component systems. Scale, fan-out, real-time, and failure thinking.",
    color: "text-amber-400",
  },
  hard: {
    label: "Hard",
    description: "Global scale, strong consistency trade-offs, multi-region, and deep reliability.",
    color: "text-rose-400",
  },
};
