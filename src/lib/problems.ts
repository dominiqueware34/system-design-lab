import type { DesignProblem, Difficulty, ProblemTrack } from "./types";

export const PROBLEMS: DesignProblem[] = [
  // ═══════════════════════════════════════════
  // CLASSIC — infra / distributed systems
  // ═══════════════════════════════════════════
  {
    id: "url-shortener",
    title: "URL Shortener",
    difficulty: "easy",
    track: "classic",
    summary:
      "Design a URL shortener with hash-based short codes, caching, and a clear scale path.",
    description:
      "Build a bit.ly-style service. Users create short codes from long URLs; redirects must be very fast. Discuss how short codes are generated (hashing / base62), how you avoid collisions, and how you would shard the mapping store as writes grow.",
    requirements: [
      "Create short URLs from long ones (hash or ID → base62)",
      "Redirect short URLs with low latency",
      "Handle collisions and optional custom aliases",
      "Optional click analytics (can be async)",
      "Explain caching + DB schema for the mapping",
    ],
    constraints: {
      expectedQps: "1,000 write QPS / 10,000 read QPS",
      latencySla: "Redirect p99 < 100ms",
      availability: "99.9%",
      dataVolume: "~100M URLs; plan path to 10B",
      consistency: "Strong for create; eventual OK for analytics",
      other: ["Short codes via hashing or distributed ID + encoding"],
    },
    evaluationFocus: [
      "hashing / ID generation",
      "caching for read-heavy path",
      "sharding plan for URL map",
      "basic redundancy",
    ],
    hints: [
      "Reads dominate writes — cache aggressively",
      "Hash vs auto-increment ID + base62 trade-offs",
    ],
  },
  {
    id: "distributed-kv",
    title: "Distributed Key-Value Store",
    difficulty: "easy",
    track: "classic",
    summary: "Design a simple KV store with consistent hashing and replication.",
    description:
      "Design a Dynamo-style key-value store used as a building block by other services. Keys must be partitioned across nodes with consistent hashing, replicated for durability, and support get/put under partition risk.",
    requirements: [
      "Get / put by key",
      "Partition keys with consistent hashing (virtual nodes)",
      "Replicate each key to N nodes",
      "Handle node join/leave with minimal data movement",
      "Discuss quorum reads/writes (R + W > N)",
    ],
    constraints: {
      expectedQps: "50,000 ops/sec cluster-wide",
      latencySla: "p99 < 20ms for local region",
      availability: "Prefer availability under network partitions (AP-leaning)",
      dataVolume: "10TB working set",
      consistency: "Tunable; default eventual with optional quorum",
      other: ["Consistent hashing ring", "Hinted handoff or anti-entropy"],
    },
    evaluationFocus: [
      "consistent hashing",
      "replication factor",
      "failure of a node",
      "hot keys",
    ],
  },
  {
    id: "rate-limiter-service",
    title: "Distributed Rate Limiter",
    difficulty: "easy",
    track: "classic",
    summary: "Shared rate limits across gateway fleet with low added latency.",
    description:
      "API gateways call your service to enforce per-user or per-IP quotas. Limits must be correct enough under concurrency and shared across many instances without becoming a bottleneck.",
    requirements: [
      "Token-bucket or sliding-window algorithm",
      "Shared state across gateway instances",
      "Low added latency",
      "Configurable limits per key",
      "Graceful degradation if limiter store is down",
    ],
    constraints: {
      expectedQps: "50,000 check QPS",
      latencySla: "p99 < 10ms",
      availability: "99.99%",
      consistency: "Approximate limits OK under races",
      other: ["Redis cluster or similar; avoid single-node SPOF"],
    },
    evaluationFocus: ["latency", "shared state", "sharding by key", "failure modes"],
  },
  {
    id: "chat-system",
    title: "Real-time Chat",
    difficulty: "medium",
    track: "classic",
    summary: "1:1 and group chat with connection scale, message sharding, and HA.",
    description:
      "Users chat in real time with presence and history. Design for connection fan-out, message persistence sharded by conversation, and multi-region growth.",
    requirements: [
      "1:1 and group messaging",
      "WebSocket (or similar) real-time delivery",
      "Message history pagination",
      "Online presence",
      "Shard message storage by conversation_id (or equivalent)",
      "Handle gateway / broker failure without message loss",
    ],
    constraints: {
      expectedQps: "50k concurrent connections; 10k messages/sec peak",
      latencySla: "Delivery p99 < 200ms",
      availability: "99.95%",
      dataVolume: "1B messages/year",
      regions: "Start single-region; plan multi-region inbox",
      consistency: "Causal order within a conversation preferred",
    },
    evaluationFocus: [
      "connection management",
      "message durability",
      "sharding by conversation",
      "broker redundancy",
    ],
  },
  {
    id: "news-feed",
    title: "News Feed at Scale",
    difficulty: "medium",
    track: "classic",
    summary: "Social feed with fan-out, celebrity problem, and sharded timelines.",
    description:
      "Users follow others and load a personalized feed. Cover push vs pull vs hybrid fan-out, timeline sharding, caching, CDN for media, and global read scale.",
    requirements: [
      "Create posts (text + media)",
      "Follow / unfollow",
      "Personalized home feed",
      "Media via object storage + CDN",
      "Celebrity / hot-key strategy",
      "Shard timelines and social graph for 100M+ users",
    ],
    constraints: {
      expectedQps: "10k post writes / 100k feed reads QPS peak",
      latencySla: "Feed load p99 < 300ms",
      availability: "99.95%",
      dataVolume: "500M users, 200M DAU",
      regions: "Multi-region reads; write region affinity OK",
      readWriteRatio: "100:1 on feed path",
    },
    evaluationFocus: [
      "fan-out hybrid",
      "timeline sharding",
      "caching + CDN",
      "celebrity problem",
      "global scale path",
    ],
  },
  {
    id: "global-id-generator",
    title: "Global Unique ID Generator",
    difficulty: "medium",
    track: "classic",
    summary: "Generate unique, roughly time-ordered IDs at global scale (Snowflake-style).",
    description:
      "Services need unique 64-bit (or similar) IDs without a single central DB bottleneck. Design for multi-datacenter, clock skew, and high QPS.",
    requirements: [
      "Generate unique IDs at high QPS",
      "Roughly time-sortable IDs",
      "No single central writer",
      "Handle multi-DC / multi-region",
      "Discuss clock sync (NTP) and failure of an ID node",
    ],
    constraints: {
      expectedQps: "100k IDs/sec globally",
      latencySla: "p99 < 5ms",
      availability: "99.99%",
      regions: "3+ regions",
      other: ["Snowflake / UUID v7 / FLAke-style composition"],
    },
    evaluationFocus: [
      "bit allocation / hashing of worker ids",
      "clock skew",
      "multi-region",
      "redundancy of generators",
    ],
  },
  {
    id: "ride-sharing",
    title: "Ride Sharing Matching",
    difficulty: "medium",
    track: "classic",
    summary: "Geo-partitioned matching of riders and drivers in real time.",
    description:
      "Match riders to nearby drivers with streaming location updates. Partition by city/geo cell, keep matching latency low, and survive matching-node failures.",
    requirements: [
      "Near-real-time driver location updates",
      "Match rider to nearby driver",
      "Trip lifecycle state machine",
      "ETA / pricing estimate",
      "Geo indexing / sharding by region or geohash",
      "Graceful driver disconnect handling",
    ],
    constraints: {
      expectedQps: "5k location updates/sec per city; 200 matches/sec peak",
      latencySla: "Match decision p99 < 1s",
      availability: "99.9%",
      regions: "Multi-city; geo-sharded",
      dataVolume: "~50k active drivers/city",
    },
    evaluationFocus: [
      "geo sharding",
      "streaming locations",
      "matching HA",
      "scale per city",
    ],
  },
  {
    id: "video-streaming",
    title: "Global Video Streaming",
    difficulty: "hard",
    track: "classic",
    summary: "Netflix-like VOD: multi-region metadata, CDN, and durable object storage.",
    description:
      "Upload, transcode, store, and stream video worldwide. Emphasize global scale: CDN edge, origin shielding, multi-region metadata DBs, sharding of catalogs, and DR.",
    requirements: [
      "Upload + multi-bitrate transcoder pipeline",
      "Global CDN delivery + adaptive bitrate",
      "Catalog search and metadata (sharded / multi-region)",
      "Recommendations path",
      "Regional rights / geo restrictions",
      "Disaster recovery for origin storage",
    ],
    constraints: {
      expectedQps: "1M concurrent streams globally",
      latencySla: "Playback start < 2s; rebuffer < 0.5%",
      availability: "99.99%",
      dataVolume: "Petabytes of assets",
      regions: "Multi-region active-active metadata; global CDN",
      budget: "Egress and storage cost-aware",
    },
    evaluationFocus: [
      "CDN + origin",
      "multi-region metadata",
      "sharding catalog",
      "pipeline HA",
      "DR",
    ],
  },
  {
    id: "payment-system",
    title: "Payment Processing Platform",
    difficulty: "hard",
    track: "classic",
    summary: "Idempotent money movement, ledger correctness, and multi-region care.",
    description:
      "Authorize/capture/refund with strong correctness. Cover idempotency keys, double-entry ledger sharding by account, webhook reliability, and what global expansion forces you to change.",
    requirements: [
      "Authorize, capture, refund",
      "Idempotent payment APIs",
      "Double-entry ledger",
      "Merchant webhooks with retries + DLQ",
      "Basic fraud hooks",
      "PCI-aware isolation of card data",
      "Shard or partition ledger by merchant/account",
    ],
    constraints: {
      expectedQps: "5,000 TPS peak",
      latencySla: "Authorize p99 < 500ms",
      availability: "99.99%",
      consistency: "Strong for money movement",
      regions: "Primary region + warm DR; plan active-active later",
      other: ["Exactly-once effects for money", "Full audit trail"],
    },
    evaluationFocus: [
      "idempotency",
      "ledger sharding",
      "queue reliability",
      "failover / DR",
      "security isolation",
    ],
  },
  {
    id: "multi-tenant-saas-db",
    title: "Multi-Tenant SaaS Data Platform",
    difficulty: "hard",
    track: "classic",
    summary: "Global multi-tenant product: tenancy model, sharding, and isolation.",
    description:
      "A B2B SaaS app serves thousands of tenants worldwide. Design the data plane: tenancy model (shared schema vs silo), shard by tenant_id, cross-region residency, noisy-neighbor controls, and migration when a tenant outgrows a shard.",
    requirements: [
      "Choose and justify tenancy model",
      "Shard / partition strategy keyed by tenant",
      "Per-tenant rate limits and isolation",
      "Region residency for some tenants (data locality)",
      "Online resharding / tenant move story",
      "Backups and point-in-time restore per tenant class",
    ],
    constraints: {
      expectedQps: "Mixed OLTP 20k QPS global",
      latencySla: "API p99 < 200ms in-region",
      availability: "99.95%",
      dataVolume: "500TB across tenants; whales up to 5TB",
      regions: "US, EU, APAC with residency rules",
      consistency: "Strong within tenant; no cross-tenant consistency needed",
    },
    evaluationFocus: [
      "tenant sharding",
      "consistent hashing / directory",
      "global residency",
      "noisy neighbor",
      "resharding",
    ],
  },

  // ═══════════════════════════════════════════
  // AGENTIC — multi-step agent workflows
  // ═══════════════════════════════════════════
  {
    id: "rag-support-agent",
    title: "RAG Customer Support Agent",
    difficulty: "easy",
    track: "agentic",
    summary:
      "Single agent with RAG over a knowledge base; choose a model and close the tool loop.",
    description:
      "Design an agentic support bot grounded in company docs. The agent should retrieve relevant chunks, call the LLM with context, and optionally escalate. Think in Andrew Ng–style loops: model → tool (RAG) → model. Include how you evaluate answer quality.",
    requirements: [
      "User chat UI → agent runtime",
      "Select an LLM (document model choice vs cost/latency)",
      "Knowledge base + embeddings + vector index",
      "RAG retriever tool results feed back into the LLM",
      "Citations / refusal when retrieval is weak",
      "At least a basic e2e or span eval story",
    ],
    constraints: {
      expectedQps: "100 concurrent conversations",
      latencySla: "First token < 2s; full answer p95 < 8s",
      tokenBudget: "Prefer mid-size model for cost control",
      maxSteps: "≤ 5 tool calls per turn",
      dataVolume: "50GB docs, weekly refresh",
      other: ["No hallucinated policy answers without retrieval support"],
    },
    evaluationFocus: [
      "model selection",
      "RAG pipeline",
      "tool → LLM feedback loop",
      "retrieval + answer evals",
    ],
    hints: [
      "Hybrid search + rerank often beats pure vector",
      "Eval: faithfulness, citation accuracy, task success",
    ],
  },
  {
    id: "research-agent-web",
    title: "Web Research Agent",
    difficulty: "easy",
    track: "agentic",
    summary: "ReAct-style agent using web search and browser tools in a multi-step loop.",
    description:
      "Users ask open-ended research questions. The agent plans queries, calls web search, optionally opens pages, synthesizes findings, and stops when enough evidence is gathered. Multi-step tool output must feed back into the model each turn.",
    requirements: [
      "Agent with ReAct or plan-and-execute pattern",
      "Web search tool + optional browser/scraper tool",
      "Explicit max-steps / budget guardrails",
      "LLM synthesizes tool results into a final answer with sources",
      "Trace each step for debugging",
    ],
    constraints: {
      latencySla: "Complete research p95 < 45s",
      maxSteps: "≤ 10 tool calls",
      tokenBudget: "Cap tokens per run; allow model router to cheaper model for extraction",
      other: ["Tool failures must not crash the run; retry or degrade"],
    },
    evaluationFocus: [
      "multi-step tool loop",
      "model choice",
      "stopping criteria",
      "source attribution",
      "tracing",
    ],
  },
  {
    id: "parallel-research-team",
    title: "Parallel Multi-Agent Research Team",
    difficulty: "medium",
    track: "agentic",
    summary: "Supervisor + parallel worker agents for long research jobs.",
    description:
      "A supervisor agent decomposes a research brief into sub-tasks, fans out to specialized workers (web, academic RAG, data/code) in parallel, then merges results. Design orchestration, shared memory, model selection per role, and evals on both spans and final report quality.",
    requirements: [
      "Supervisor / worker multi-agent topology",
      "Parallel fan-out of workers (map → reduce synthesize)",
      "Different models per role (e.g. small for extraction, large for final write)",
      "Tools: web search, RAG, optional code exec",
      "Workflow orchestrator with checkpointing",
      "Span evals on worker steps + e2e eval on final report",
    ],
    constraints: {
      latencySla: "Draft report p95 < 3 minutes",
      maxSteps: "≤ 30 total tool calls across workers",
      tokenBudget: "Cost ceiling per job; parallelism limited to 4 workers",
      other: ["Partial worker failure → best-effort merge", "Human review optional for high-stakes"],
    },
    evaluationFocus: [
      "multi-agent parallelization",
      "orchestration",
      "model routing",
      "span + e2e evals",
      "failure isolation",
    ],
  },
  {
    id: "coding-agent-pr",
    title: "Coding Agent for Pull Requests",
    difficulty: "medium",
    track: "agentic",
    summary: "Agent that plans, edits code, runs tests in a sandbox, and iterates.",
    description:
      "Given a ticket, an agent explores a repo, proposes a plan, edits files, runs tests via a code-exec tool, and loops until green or max steps. Include guardrails, human approval before merge, and evals (unit tests as oracle + LLM judge on plan quality).",
    requirements: [
      "Planner + coder agent(s) with tool loop",
      "Code executor / sandbox tool (tests, linters)",
      "Repo / file tools (function tools)",
      "Reflection after failed tests (tool output → LLM)",
      "Human review gate before opening PR / merge",
      "Trace collector + span evals on tool choices; e2e on task success",
    ],
    constraints: {
      maxSteps: "≤ 25 iterations",
      latencySla: "Typical small ticket < 15 minutes",
      tokenBudget: "Prefer strong model for planning; cheaper for boilerplate",
      other: ["No unrestricted network from sandbox", "Secrets never in prompts"],
    },
    evaluationFocus: [
      "tool feedback loop",
      "sandbox safety",
      "human-in-the-loop",
      "evals against tests",
      "model selection",
    ],
  },
  {
    id: "enterprise-agent-platform",
    title: "Enterprise Agentic Platform",
    difficulty: "hard",
    track: "agentic",
    summary: "Multi-tenant platform: many agents, tools, models, and continuous evals.",
    description:
      "Design a company-wide platform where product teams ship agentic workflows. Include model gateway (routing + spend limits), tool registry, multi-agent orchestration, RAG tenancy, tracing, online/offline evals, and how you scale tool backends and vector indexes globally.",
    requirements: [
      "Multi-tenant agent runtime + workflow orchestrator",
      "Model gateway with per-tenant budgets and model selection",
      "Tool registry (web, RAG, internal APIs) with allowlists",
      "Parallel multi-agent jobs with isolation",
      "Per-tenant knowledge bases (sharded vector indexes)",
      "Trace collector; span evals + e2e regression gates on deploy",
      "Global scale: multi-region runtimes, data residency for corpora",
    ],
    constraints: {
      expectedQps: "5k agent runs/min peak",
      latencySla: "Simple agents p95 < 10s; batch jobs async",
      availability: "99.9% control plane",
      regions: "US + EU residency for RAG corpora",
      tokenBudget: "Hard per-tenant monthly caps",
      other: ["Eval gate blocks bad prompt/model rollouts", "PII scrubbing in traces"],
    },
    evaluationFocus: [
      "multi-tenant isolation",
      "model gateway",
      "tool governance",
      "eval gates",
      "vector index sharding / global scale",
      "observability",
    ],
  },
  {
    id: "eval-driven-agent-improvement",
    title: "Eval-Driven Agent Improvement Loop",
    difficulty: "hard",
    track: "agentic",
    summary: "Design the system that measures and improves agents over time.",
    description:
      "You already have production agents. Design the evaluation subsystem: offline golden sets, online span sampling, LLM-as-judge vs human labels, prompt registry A/B, and how failing evals trigger workflow changes. Interviewers will push: where does quality break, and how do you know?",
    requirements: [
      "Trace every agent run (prompts, tools, tokens, latency)",
      "Span-level metrics (retrieval precision, tool correctness, faithfulness)",
      "E2E task success on golden + production-sampled sets",
      "Prompt/model registry with A/B and deploy gates",
      "Human labeling queue for disagreements",
      "Feedback into retraining chunking, tool schemas, or prompts",
      "Dashboards + alerts when quality regresses",
    ],
    constraints: {
      dataVolume: "10M spans/day; retain 30 days hot, 1 year cold",
      latencySla: "Online judge pipeline must not add > 50ms to user path (async OK)",
      budget: "Judge model cost < 15% of production inference",
      other: ["PII scrubbing", "Avoid reward hacking of LLM judges"],
    },
    evaluationFocus: [
      "span vs e2e evals",
      "sampling strategy",
      "judge reliability",
      "deploy gates",
      "closed-loop improvement",
    ],
  },
];

export function getProblemById(id: string): DesignProblem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

export function getProblemsByDifficulty(difficulty: Difficulty): DesignProblem[] {
  return PROBLEMS.filter((p) => p.difficulty === difficulty);
}

export function getProblemsByTrack(track: ProblemTrack): DesignProblem[] {
  return PROBLEMS.filter((p) => p.track === track);
}

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; description: string; color: string }
> = {
  easy: {
    label: "Easy",
    description: "Core path clear; a few components and basic failure thinking.",
    color: "text-emerald-400",
  },
  medium: {
    label: "Medium",
    description: "Multi-component / multi-agent. Scale, fan-out, and tool loops.",
    color: "text-amber-400",
  },
  hard: {
    label: "Hard",
    description: "Global scale, multi-tenant, strong evals, deep reliability.",
    color: "text-rose-400",
  },
};

export const TRACK_META: Record<
  ProblemTrack,
  { label: string; description: string; color: string; badge: string }
> = {
  classic: {
    label: "Classic systems",
    description: "Distributed systems: DBs, sharding, hashing, caches, global scale.",
    color: "text-sky-400",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
  agentic: {
    label: "Agentic AI",
    description: "Models, tools (RAG, web), multi-agent, multi-step loops, evals.",
    color: "text-violet-400",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  },
};
