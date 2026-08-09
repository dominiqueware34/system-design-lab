/**
 * Programmatic 20-prompt season pack when XAI is unavailable.
 * All graphs use real catalog types/attributes and pass validateDesignGraph.
 */

import { makeEdge, makeGraph, makeNode } from "@/lib/design-graph-builder";
import type { SeasonPrompt } from "@/lib/campaign-prompt-schema";

function classicUrlShortener(): SeasonPrompt {
  return {
    id: "season-url-shortener",
    title: "URL Shortener at Scale",
    difficulty: "easy",
    track: "classic",
    summary:
      "Design a bit.ly-style shortener with hash codes, cache, and a scale path.",
    description:
      "Users create short codes from long URLs; redirects must be very fast. Cover code generation, collision handling, caching, and sharding of the mapping store.",
    requirements: [
      "Create short URLs (hash or ID encoding)",
      "Low-latency redirects",
      "Handle collisions / custom aliases",
      "Cache hot mappings",
      "Explain DB schema and scale path",
    ],
    constraints: {
      expectedQps: "1k write / 10k read QPS",
      latencySla: "Redirect p99 < 100ms",
      availability: "99.9%",
      consistency: "Strong for create",
    },
    evaluationFocus: [
      "hashing / ID generation",
      "caching",
      "sharding plan",
      "redundancy",
    ],
    hints: ["Reads dominate — cache aggressively"],
    referenceDesign: makeGraph(
      [
        makeNode("client", "web_client", { x: 0, y: 80 }),
        makeNode("cdn", "cdn", { x: 180, y: 80 }, { regions: "Global" }),
        makeNode("lb", "load_balancer", { x: 360, y: 80 }),
        makeNode("api", "app_server", { x: 540, y: 80 }, { replicas: 4 }),
        makeNode(
          "cache",
          "cache",
          { x: 720, y: 0 },
          { engine: "Redis", eviction: "LRU" }
        ),
        makeNode(
          "db",
          "sql_database",
          { x: 720, y: 160 },
          {
            engine: "PostgreSQL",
            replication: "Async replicas",
            partitionStrategy: "Hash",
            shardKey: "hash(id)",
          }
        ),
      ],
      [
        makeEdge("e1", "client", "cdn"),
        makeEdge("e2", "cdn", "lb"),
        makeEdge("e3", "lb", "api"),
        makeEdge("e4", "api", "cache", "GET mapping"),
        makeEdge("e5", "api", "db", "write / miss"),
      ]
    ),
    rationale:
      "Edge + LB for latency and scale; Redis absorbs redirect reads; SQL holds durable mappings with a clear hash partition path.",
  };
}

function classicKv(): SeasonPrompt {
  return {
    id: "season-distributed-kv",
    title: "Distributed Key-Value Store",
    difficulty: "easy",
    track: "classic",
    summary: "Dynamo-style KV with consistent hashing and replication.",
    description:
      "Design a key-value store: partition with consistent hashing, replicate for durability, support get/put under partition risk.",
    requirements: [
      "Get/put by key",
      "Consistent hashing with virtual nodes",
      "Replication factor N",
      "Node join/leave with limited movement",
      "Quorum reads/writes",
    ],
    constraints: {
      expectedQps: "50k ops/sec",
      latencySla: "p99 < 20ms local",
      availability: "AP-leaning",
      consistency: "Tunable quorum",
    },
    evaluationFocus: [
      "consistent hashing",
      "replication",
      "node failure",
      "hot keys",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("client", "web_client", { x: 0, y: 100 }),
        makeNode("gw", "api_gateway", { x: 180, y: 100 }),
        makeNode(
          "kv",
          "nosql_database",
          { x: 400, y: 100 },
          {
            model: "Key-value",
            engine: "DynamoDB",
            hashing: "Consistent hashing",
            partitioning: true,
            consistency: "Eventual",
          }
        ),
        makeNode("mon", "monitoring", { x: 600, y: 100 }),
      ],
      [
        makeEdge("e1", "client", "gw"),
        makeEdge("e2", "gw", "kv"),
        makeEdge("e3", "kv", "mon", "metrics"),
      ]
    ),
    rationale:
      "Gateway fronts a KV store configured for consistent hashing and multi-AZ replication; monitoring tracks hot partitions.",
  };
}

function classicRateLimiter(): SeasonPrompt {
  return {
    id: "season-rate-limiter",
    title: "Distributed Rate Limiter",
    difficulty: "easy",
    track: "classic",
    summary: "Shared rate limits across gateway fleet with low added latency.",
    description:
      "Gateways call a limiter for per-user or per-IP quotas. Limits must be shared across instances without becoming a bottleneck.",
    requirements: [
      "Token-bucket or sliding window",
      "Shared state across instances",
      "Low added latency",
      "Configurable limits per key",
      "Degrade gracefully if store is down",
    ],
    constraints: {
      expectedQps: "50k check QPS",
      latencySla: "p99 < 10ms",
      availability: "99.99%",
    },
    evaluationFocus: ["latency", "shared state", "sharding by key", "failure"],
    referenceDesign: makeGraph(
      [
        makeNode("gw", "api_gateway", { x: 0, y: 80 }),
        makeNode(
          "rl",
          "rate_limiter",
          { x: 200, y: 80 },
          { strategy: "Token bucket" }
        ),
        makeNode(
          "store",
          "cache",
          { x: 400, y: 80 },
          { engine: "Redis", clustered: true }
        ),
        makeNode("api", "app_server", { x: 600, y: 80 }),
      ],
      [
        makeEdge("e1", "gw", "rl", "check"),
        makeEdge("e2", "rl", "store"),
        makeEdge("e3", "rl", "api", "allow"),
      ]
    ),
    rationale:
      "Rate limiter with Redis cluster state keeps checks fast and sharded by key; gateway enforces before app work.",
  };
}

function classicChat(): SeasonPrompt {
  return {
    id: "season-realtime-chat",
    title: "Real-time Chat System",
    difficulty: "medium",
    track: "classic",
    summary: "1:1 and group chat with presence, fan-out, and message history.",
    description:
      "Design messaging with low-latency delivery, offline inbox, and scalable group fan-out.",
    requirements: [
      "1:1 and group messages",
      "Presence / online status",
      "Message history and search",
      "Push for offline users",
      "Order within a conversation",
    ],
    constraints: {
      expectedQps: "100k concurrent connections",
      latencySla: "Message p99 < 200ms same region",
      dataVolume: "Billions of messages",
      consistency: "Causal within conversation",
    },
    evaluationFocus: [
      "connection tier",
      "fan-out",
      "storage split",
      "offline delivery",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("mobile", "mobile_client", { x: 0, y: 40 }),
        makeNode("web", "web_client", { x: 0, y: 160 }),
        makeNode("gw", "api_gateway", { x: 200, y: 100 }),
        makeNode("chat", "microservice", { x: 400, y: 100 }, {
          name: "chat-service",
        }),
        makeNode("q", "message_queue", { x: 600, y: 40 }),
        makeNode(
          "msgdb",
          "nosql_database",
          { x: 600, y: 160 },
          { model: "Wide-column", engine: "Cassandra" }
        ),
        makeNode("cache", "cache", { x: 400, y: 220 }),
      ],
      [
        makeEdge("e1", "mobile", "gw"),
        makeEdge("e2", "web", "gw"),
        makeEdge("e3", "gw", "chat"),
        makeEdge("e4", "chat", "q", "fan-out"),
        makeEdge("e5", "chat", "msgdb", "persist"),
        makeEdge("e6", "chat", "cache", "presence"),
      ]
    ),
    rationale:
      "Gateway + chat service with async fan-out queue, durable wide-column history, and cache for presence.",
  };
}

function classicNewsFeed(): SeasonPrompt {
  return {
    id: "season-news-feed",
    title: "News Feed / Timeline",
    difficulty: "medium",
    track: "classic",
    summary: "Fan-out on write/read hybrid feed for social timeline.",
    description:
      "Users post and follow others; home timeline must stay fast as graph and write volume grow.",
    requirements: [
      "Publish posts",
      "Home timeline for followees",
      "Handle celebrity fan-out",
      "Pagination and ranking hooks",
      "Cache hot timelines",
    ],
    constraints: {
      expectedQps: "10k write / 100k read QPS",
      latencySla: "Timeline p99 < 300ms",
      dataVolume: "Multi-TB posts + edges",
    },
    evaluationFocus: ["fan-out strategy", "cache", "celebrity problem", "ranking storage"],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 100 }),
        makeNode("lb", "load_balancer", { x: 160, y: 100 }),
        makeNode("feed", "app_server", { x: 320, y: 100 }),
        makeNode("q", "pubsub", { x: 480, y: 40 }),
        makeNode("worker", "worker", { x: 640, y: 40 }),
        makeNode(
          "cache",
          "cache",
          { x: 480, y: 160 },
          { engine: "Redis" }
        ),
        makeNode(
          "db",
          "sql_database",
          { x: 640, y: 160 },
          { sharding: true, shardKey: "user_id" }
        ),
      ],
      [
        makeEdge("e1", "c", "lb"),
        makeEdge("e2", "lb", "feed"),
        makeEdge("e3", "feed", "q", "post events"),
        makeEdge("e4", "q", "worker"),
        makeEdge("e5", "worker", "cache", "precompute"),
        makeEdge("e6", "feed", "cache", "read timeline"),
        makeEdge("e7", "feed", "db"),
      ]
    ),
    rationale:
      "Hybrid fan-out: workers precompute timelines into cache; SQL holds durable posts sharded by user.",
  };
}

function classicIdGen(): SeasonPrompt {
  return {
    id: "season-global-id",
    title: "Global Unique ID Generator",
    difficulty: "medium",
    track: "classic",
    summary: "High-throughput globally unique IDs with rough time ordering.",
    description:
      "Services need unique 64-bit IDs at high QPS without a single coordinator bottleneck.",
    requirements: [
      "Globally unique IDs",
      "High throughput multi-region",
      "Rough time-sortable",
      "No single point of failure",
      "Explain clock / sequence design",
    ],
    constraints: {
      expectedQps: "100k IDs/sec",
      latencySla: "p99 < 5ms",
      regions: "3 regions",
    },
    evaluationFocus: ["uniqueness", "clock skew", "throughput", "multi-region"],
    referenceDesign: makeGraph(
      [
        makeNode("svc", "microservice", { x: 0, y: 80 }, { name: "id-service" }),
        makeNode("lb", "load_balancer", { x: 200, y: 80 }),
        makeNode(
          "idnodes",
          "app_server",
          { x: 400, y: 80 },
          { replicas: 6 }
        ),
        makeNode("zk", "cache", { x: 600, y: 80 }, { engine: "Redis" }),
      ],
      [
        makeEdge("e1", "svc", "lb"),
        makeEdge("e2", "lb", "idnodes"),
        makeEdge("e3", "idnodes", "zk", "worker id lease"),
      ]
    ),
    rationale:
      "Stateless ID nodes with leased worker bits (Snowflake-style) avoid a single sequence bottleneck.",
  };
}

function classicRideShare(): SeasonPrompt {
  return {
    id: "season-ride-sharing",
    title: "Ride Sharing Dispatch",
    difficulty: "hard",
    track: "classic",
    summary: "Match riders to nearby drivers with geo indexing and realtime updates.",
    description:
      "Design dispatch: location updates, nearby search, matching, trip state, and surge-friendly scale.",
    requirements: [
      "Driver location streaming",
      "Nearby driver query",
      "Match + trip lifecycle",
      "ETA estimation path",
      "Handle region spikes",
    ],
    constraints: {
      expectedQps: "50k location updates/sec",
      latencySla: "Match p99 < 1s",
      regions: "Multi-city geo partitions",
      consistency: "Strong trip state; eventual location",
    },
    evaluationFocus: ["geo index", "streaming locations", "matching", "partition by city"],
    referenceDesign: makeGraph(
      [
        makeNode("driver", "mobile_client", { x: 0, y: 40 }),
        makeNode("rider", "mobile_client", { x: 0, y: 160 }),
        makeNode("gw", "api_gateway", { x: 180, y: 100 }),
        makeNode("dispatch", "microservice", { x: 360, y: 100 }, {
          name: "dispatch",
        }),
        makeNode("stream", "stream_processor", { x: 540, y: 40 }),
        makeNode(
          "geo",
          "nosql_database",
          { x: 540, y: 160 },
          {
            model: "Key-value",
            engine: "Redis",
            partitionKey: "geo+id",
            hashing: "Consistent hashing",
          }
        ),
        makeNode(
          "trips",
          "sql_database",
          { x: 720, y: 100 },
          { sharding: true, shardKey: "geo" }
        ),
        makeNode("q", "message_queue", { x: 360, y: 220 }),
      ],
      [
        makeEdge("e1", "driver", "gw"),
        makeEdge("e2", "rider", "gw"),
        makeEdge("e3", "gw", "dispatch"),
        makeEdge("e4", "dispatch", "stream", "locations"),
        makeEdge("e5", "stream", "geo"),
        makeEdge("e6", "dispatch", "geo", "nearby"),
        makeEdge("e7", "dispatch", "trips"),
        makeEdge("e8", "dispatch", "q", "notifications"),
      ]
    ),
    rationale:
      "Location stream updates a geo index; SQL holds trip lifecycle; queue notifies parties asynchronously.",
  };
}

function classicVideo(): SeasonPrompt {
  return {
    id: "season-video-streaming",
    title: "Video Streaming Platform",
    difficulty: "hard",
    track: "classic",
    summary: "Upload, transcode, and CDN-deliver adaptive bitrate video.",
    description:
      "Users upload videos; system processes encodings and serves ABR streams globally with low startup latency.",
    requirements: [
      "Upload to object storage",
      "Async transcoding pipeline",
      "ABR packaging",
      "Global CDN delivery",
      "Metadata catalog + search",
    ],
    constraints: {
      expectedQps: "10k concurrent viewers / region",
      latencySla: "Startup < 2s on good networks",
      dataVolume: "PB object storage",
      regions: "Global CDN",
    },
    evaluationFocus: ["pipeline", "object storage", "CDN", "metadata scale"],
    referenceDesign: makeGraph(
      [
        makeNode("web", "web_client", { x: 0, y: 100 }),
        makeNode("cdn", "cdn", { x: 180, y: 40 }, { regions: "Global" }),
        makeNode("api", "api_gateway", { x: 180, y: 160 }),
        makeNode("obj", "object_storage", { x: 360, y: 40 }),
        makeNode("q", "message_queue", { x: 360, y: 160 }),
        makeNode("worker", "worker", { x: 540, y: 160 }),
        makeNode(
          "meta",
          "sql_database",
          { x: 540, y: 40 },
          { engine: "PostgreSQL" }
        ),
        makeNode("search", "search_index", { x: 720, y: 100 }),
      ],
      [
        makeEdge("e1", "web", "cdn", "playback"),
        makeEdge("e2", "web", "api", "upload/meta"),
        makeEdge("e3", "api", "obj"),
        makeEdge("e4", "api", "q", "transcode job"),
        makeEdge("e5", "q", "worker"),
        makeEdge("e6", "worker", "obj", "renditions"),
        makeEdge("e7", "api", "meta"),
        makeEdge("e8", "meta", "search"),
        makeEdge("e9", "cdn", "obj", "origin"),
      ]
    ),
    rationale:
      "Object storage + async workers for encode; CDN for global ABR; SQL/search for catalog.",
  };
}

function classicPayments(): SeasonPrompt {
  return {
    id: "season-payment-system",
    title: "Payment Processing",
    difficulty: "hard",
    track: "classic",
    summary: "Idempotent payments with ledger, retries, and auditability.",
    description:
      "Design charge/refund flows with strong correctness, idempotency keys, and reconciliation.",
    requirements: [
      "Authorize + capture",
      "Idempotent APIs",
      "Double-entry ledger",
      "Retry-safe webhooks",
      "Audit / compliance trail",
    ],
    constraints: {
      expectedQps: "5k TPS peak",
      latencySla: "Authorize p99 < 400ms",
      availability: "99.99%",
      consistency: "Strong for balances",
    },
    evaluationFocus: [
      "idempotency",
      "ledger design",
      "exactly-once effects",
      "failure recovery",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 100 }),
        makeNode("gw", "api_gateway", { x: 160, y: 100 }),
        makeNode("pay", "microservice", { x: 320, y: 100 }, {
          name: "payments",
        }),
        makeNode(
          "ledger",
          "sql_database",
          { x: 500, y: 40 },
          { engine: "PostgreSQL", replication: "Sync multi-AZ" }
        ),
        makeNode("q", "message_queue", { x: 500, y: 160 }),
        makeNode("worker", "worker", { x: 680, y: 160 }),
        makeNode("secrets", "secrets_manager", { x: 320, y: 220 }),
        makeNode("log", "logging", { x: 680, y: 40 }),
      ],
      [
        makeEdge("e1", "c", "gw"),
        makeEdge("e2", "gw", "pay"),
        makeEdge("e3", "pay", "ledger"),
        makeEdge("e4", "pay", "q", "webhooks"),
        makeEdge("e5", "q", "worker"),
        makeEdge("e6", "pay", "secrets"),
        makeEdge("e7", "pay", "log", "audit"),
      ]
    ),
    rationale:
      "Sync multi-AZ SQL ledger for money correctness; async queue for webhooks; secrets and audit logging for compliance.",
  };
}

function classicMultiTenant(): SeasonPrompt {
  return {
    id: "season-multi-tenant-saas",
    title: "Multi-tenant SaaS Data Plane",
    difficulty: "hard",
    track: "classic",
    summary: "Isolate tenants while sharing infra efficiently.",
    description:
      "Design storage and compute isolation for a B2B SaaS with noisy-neighbor controls and per-tenant config.",
    requirements: [
      "Tenant isolation model",
      "Per-tenant config / feature flags",
      "Noisy neighbor protection",
      "Backup / restore per tenant",
      "Migrate heavy tenants to dedicated",
    ],
    constraints: {
      expectedQps: "Mixed; some whales",
      consistency: "Strong per tenant",
      regions: "US + EU residency options",
    },
    evaluationFocus: [
      "isolation strategy",
      "sharding by tenant",
      "rate limits",
      "data residency",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 100 }),
        makeNode("gw", "api_gateway", { x: 160, y: 100 }),
        makeNode("rl", "rate_limiter", { x: 320, y: 40 }),
        makeNode("app", "app_server", { x: 320, y: 160 }),
        makeNode(
          "db",
          "sql_database",
          { x: 500, y: 100 },
          {
            sharding: true,
            shardKey: "tenant_id",
            partitionStrategy: "Directory",
          }
        ),
        makeNode("auth", "auth_service", { x: 160, y: 200 }),
        makeNode("obj", "object_storage", { x: 500, y: 200 }),
      ],
      [
        makeEdge("e1", "c", "gw"),
        makeEdge("e2", "gw", "rl"),
        makeEdge("e3", "rl", "app"),
        makeEdge("e4", "app", "db"),
        makeEdge("e5", "gw", "auth"),
        makeEdge("e6", "app", "obj"),
      ]
    ),
    rationale:
      "Tenant_id sharding + directory for whales, gateway rate limits, and auth boundary enforce isolation.",
  };
}

function classicSearch(): SeasonPrompt {
  return {
    id: "season-product-search",
    title: "Product Search Service",
    difficulty: "medium",
    track: "classic",
    summary: "Low-latency product search with indexing pipeline.",
    description:
      "Index catalog updates and serve ranked search with filters and autocomplete.",
    requirements: [
      "Full-text + filters",
      "Near-real-time index updates",
      "Autocomplete",
      "Handle reindex without downtime",
      "Observe query latency",
    ],
    constraints: {
      expectedQps: "20k query QPS",
      latencySla: "p99 < 150ms",
      dataVolume: "50M SKUs",
    },
    evaluationFocus: ["index pipeline", "query path", "reindex", "caching"],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 80 }),
        makeNode("gw", "api_gateway", { x: 160, y: 80 }),
        makeNode("search", "search_index", { x: 360, y: 40 }),
        makeNode("api", "app_server", { x: 360, y: 140 }),
        makeNode("q", "message_queue", { x: 540, y: 140 }),
        makeNode("idx", "worker", { x: 720, y: 140 }),
        makeNode("db", "sql_database", { x: 540, y: 40 }),
        makeNode("cache", "cache", { x: 160, y: 180 }),
      ],
      [
        makeEdge("e1", "c", "gw"),
        makeEdge("e2", "gw", "api"),
        makeEdge("e3", "api", "search", "query"),
        makeEdge("e4", "api", "cache"),
        makeEdge("e5", "db", "q", "CDC"),
        makeEdge("e6", "q", "idx"),
        makeEdge("e7", "idx", "search", "index"),
      ]
    ),
    rationale:
      "Query path hits search index (+ cache); async workers keep index fresh from DB change events.",
  };
}

function classicCdnStatic(): SeasonPrompt {
  return {
    id: "season-global-static",
    title: "Global Static Asset Delivery",
    difficulty: "easy",
    track: "classic",
    summary: "Serve static assets with CDN, cache headers, and origin shield.",
    description:
      "Design delivery for JS/CSS/images with high hit ratio and controlled invalidation.",
    requirements: [
      "Global CDN",
      "Cache-control strategy",
      "Invalidation / versioned URLs",
      "Origin protection",
      "HTTPS + WAF basics",
    ],
    constraints: {
      expectedQps: "200k asset requests/sec",
      latencySla: "p99 < 100ms edge",
      regions: "Global",
    },
    evaluationFocus: ["CDN", "cache keys", "origin shield", "security edge"],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 80 }),
        makeNode("dns", "dns", { x: 140, y: 80 }),
        makeNode("cdn", "cdn", { x: 300, y: 80 }),
        makeNode("waf", "waf", { x: 460, y: 80 }),
        makeNode("origin", "object_storage", { x: 620, y: 80 }),
      ],
      [
        makeEdge("e1", "c", "dns"),
        makeEdge("e2", "dns", "cdn"),
        makeEdge("e3", "cdn", "waf", "origin miss"),
        makeEdge("e4", "waf", "origin"),
      ]
    ),
    rationale:
      "DNS → CDN for edge hits; WAF-protected object origin for misses; versioned assets simplify invalidation.",
  };
}

function agenticRag(): SeasonPrompt {
  return {
    id: "season-rag-support",
    title: "RAG Support Agent",
    difficulty: "medium",
    track: "agentic",
    summary: "Customer support agent grounded on a knowledge base with span evals.",
    description:
      "Design an agent that answers support questions using RAG, tool loops, and quality measurement.",
    requirements: [
      "Retrieve relevant docs",
      "Grounded answers with citations",
      "Multi-step tool→LLM loop",
      "Span and/or e2e evals",
      "Guardrails for unsafe content",
    ],
    constraints: {
      tokenBudget: "8k context preferred",
      maxSteps: "6 tool steps",
      latencySla: "p95 < 8s",
    },
    evaluationFocus: [
      "model selection",
      "RAG quality",
      "tool loop edges",
      "evals",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 100 }),
        makeNode("gw", "api_gateway", { x: 140, y: 100 }),
        makeNode("agent", "agent", { x: 300, y: 100 }, {
          role: "Specialist",
          maxSteps: 6,
        }),
        makeNode("llm", "llm_model", { x: 460, y: 20 }, {
          model: "grok-4.5",
          temperature: 0.2,
        }),
        makeNode("rag", "tool_rag", { x: 460, y: 100 }),
        makeNode("vdb", "vector_db", { x: 620, y: 100 }),
        makeNode("emb", "embedding_model", { x: 620, y: 20 }),
        makeNode("guard", "guardrails", { x: 300, y: 200 }),
        makeNode("span", "span_eval", { x: 460, y: 200 }),
        makeNode("trace", "trace_collector", { x: 620, y: 200 }),
      ],
      [
        makeEdge("e1", "c", "gw"),
        makeEdge("e2", "gw", "agent"),
        makeEdge("e3", "agent", "llm"),
        makeEdge("e4", "agent", "rag"),
        makeEdge("e5", "rag", "vdb"),
        makeEdge("e6", "emb", "vdb"),
        makeEdge("e7", "agent", "guard"),
        makeEdge("e8", "agent", "span"),
        makeEdge("e9", "span", "trace"),
      ]
    ),
    rationale:
      "Agent loops LLM + RAG over a vector index with embeddings; guardrails and span evals close the quality loop.",
  };
}

function agenticResearch(): SeasonPrompt {
  return {
    id: "season-research-agent",
    title: "Web Research Agent",
    difficulty: "medium",
    track: "agentic",
    summary: "Multi-step research with web search and synthesis.",
    description:
      "Agent plans queries, searches the web, stores notes, and produces a sourced brief.",
    requirements: [
      "Plan research steps",
      "Web search tool use",
      "Memory for intermediate notes",
      "Cited synthesis",
      "Traceability of steps",
    ],
    constraints: {
      maxSteps: "12",
      tokenBudget: "32k",
      latencySla: "Job may run minutes async",
    },
    evaluationFocus: ["tool loop", "memory", "citations", "tracing"],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 80 }),
        makeNode("orch", "workflow_orchestrator", { x: 160, y: 80 }),
        makeNode("agent", "agent", { x: 320, y: 80 }, {
          role: "Researcher",
          maxSteps: 12,
        }),
        makeNode("llm", "llm_model", { x: 480, y: 20 }),
        makeNode("search", "tool_web_search", { x: 480, y: 100 }),
        makeNode("mem", "agent_memory", { x: 480, y: 180 }),
        makeNode("trace", "trace_collector", { x: 640, y: 80 }),
      ],
      [
        makeEdge("e1", "c", "orch"),
        makeEdge("e2", "orch", "agent"),
        makeEdge("e3", "agent", "llm"),
        makeEdge("e4", "agent", "search"),
        makeEdge("e5", "agent", "mem"),
        makeEdge("e6", "agent", "trace"),
      ]
    ),
    rationale:
      "Orchestrator runs a researcher agent with web search + memory; traces capture each tool step.",
  };
}

function agenticMultiAgent(): SeasonPrompt {
  return {
    id: "season-parallel-research-team",
    title: "Parallel Multi-Agent Research Team",
    difficulty: "hard",
    track: "agentic",
    summary: "Fan-out specialists then synthesize with a lead agent.",
    description:
      "Design a team: planner, parallel researchers, critic, and merger with shared memory and evals.",
    requirements: [
      "Multi-agent team topology",
      "Parallel fan-out",
      "Shared memory / blackboard",
      "Critic or reflection pass",
      "E2e task evals",
    ],
    constraints: {
      maxSteps: "20 total team steps",
      tokenBudget: "Budget-aware model routing",
      latencySla: "Batch job < 10 min",
    },
    evaluationFocus: [
      "multi-agent parallelization",
      "routing",
      "shared memory",
      "e2e evals",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 120 }),
        makeNode("team", "multi_agent_team", { x: 160, y: 120 }),
        makeNode("fan", "parallel_fanout", { x: 320, y: 120 }),
        makeNode("r1", "agent", { x: 480, y: 40 }, { role: "Researcher" }),
        makeNode("r2", "agent", { x: 480, y: 120 }, { role: "Specialist" }),
        makeNode("critic", "agent", { x: 480, y: 200 }, {
          role: "Critic/Reflector",
        }),
        makeNode("mem", "agent_memory", { x: 640, y: 120 }),
        makeNode("e2e", "e2e_eval", { x: 320, y: 220 }),
        makeNode("llm", "llm_model", { x: 640, y: 40 }),
      ],
      [
        makeEdge("e1", "c", "team"),
        makeEdge("e2", "team", "fan"),
        makeEdge("e3", "fan", "r1"),
        makeEdge("e4", "fan", "r2"),
        makeEdge("e5", "fan", "critic"),
        makeEdge("e6", "r1", "mem"),
        makeEdge("e7", "r2", "mem"),
        makeEdge("e8", "critic", "mem"),
        makeEdge("e9", "team", "e2e"),
        makeEdge("e10", "r1", "llm"),
      ]
    ),
    rationale:
      "Team + parallel fan-out runs specialists concurrently into shared memory; e2e evals gate quality.",
  };
}

function agenticCoding(): SeasonPrompt {
  return {
    id: "season-coding-agent",
    title: "Coding Agent for PRs",
    difficulty: "hard",
    track: "agentic",
    summary: "Agent that edits code with sandboxed exec and human review gates.",
    description:
      "Design an agent that plans changes, edits files, runs tests in a sandbox, and opens a PR with human approval for risky steps.",
    requirements: [
      "Code understanding + edit plan",
      "Sandboxed code execution",
      "Test feedback loop",
      "Human review for merge",
      "Prompt/version registry",
    ],
    constraints: {
      maxSteps: "15",
      tokenBudget: "128k context model available",
      other: ["No unrestricted prod access"],
    },
    evaluationFocus: [
      "tool_code_exec",
      "human gates",
      "feedback loops",
      "prompt registry",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("dev", "web_client", { x: 0, y: 100 }),
        makeNode("agent", "agent", { x: 160, y: 100 }, {
          role: "Coder",
          maxSteps: 15,
        }),
        makeNode("llm", "llm_model", { x: 320, y: 20 }, {
          model: "grok-4.5",
          contextWindow: "128k",
        }),
        makeNode("code", "tool_code_exec", { x: 320, y: 100 }),
        makeNode("fn", "tool_function", { x: 320, y: 180 }, {
          name: "git_pr_api",
        }),
        makeNode("human", "human_review", { x: 480, y: 100 }),
        makeNode("prompts", "prompt_registry", { x: 160, y: 200 }),
        makeNode("span", "span_eval", { x: 480, y: 200 }),
      ],
      [
        makeEdge("e1", "dev", "agent"),
        makeEdge("e2", "agent", "llm"),
        makeEdge("e3", "agent", "code"),
        makeEdge("e4", "agent", "fn"),
        makeEdge("e5", "agent", "human", "approve merge"),
        makeEdge("e6", "agent", "prompts"),
        makeEdge("e7", "agent", "span"),
      ]
    ),
    rationale:
      "Coder agent loops on sandboxed exec + git tools; human review gates merge; prompt registry + span evals track quality.",
  };
}

function agenticEnterprise(): SeasonPrompt {
  return {
    id: "season-enterprise-agent-platform",
    title: "Enterprise Agent Platform",
    difficulty: "hard",
    track: "agentic",
    summary: "Multi-tenant agent platform with routing, guardrails, and observability.",
    description:
      "Platform teams host many internal agents: model routing, tool permissions, tenancy, traces, and eval gates before deploy.",
    requirements: [
      "Model router / gateway",
      "Per-tenant tool permissions",
      "Guardrails + PII controls",
      "Central traces",
      "Deploy-gated e2e evals",
    ],
    constraints: {
      regions: "Enterprise VPC",
      tokenBudget: "Per-tenant quotas",
      availability: "99.9% control plane",
    },
    evaluationFocus: [
      "router_gateway",
      "tenancy",
      "guardrails",
      "evals before deploy",
    ],
    referenceDesign: makeGraph(
      [
        makeNode("c", "web_client", { x: 0, y: 100 }),
        makeNode("router", "router_gateway", { x: 160, y: 100 }),
        makeNode("agent", "agent", { x: 320, y: 100 }),
        makeNode("llm", "llm_model", { x: 480, y: 40 }, {
          provider: "Router/multi",
        }),
        makeNode("tools", "tool_function", { x: 480, y: 120 }),
        makeNode("guard", "guardrails", { x: 320, y: 200 }),
        makeNode("auth", "auth_service", { x: 160, y: 200 }),
        makeNode("trace", "trace_collector", { x: 480, y: 200 }),
        makeNode("e2e", "e2e_eval", { x: 640, y: 100 }),
        makeNode("prompts", "prompt_registry", { x: 640, y: 200 }),
      ],
      [
        makeEdge("e1", "c", "router"),
        makeEdge("e2", "router", "agent"),
        makeEdge("e3", "agent", "llm"),
        makeEdge("e4", "agent", "tools"),
        makeEdge("e5", "agent", "guard"),
        makeEdge("e6", "router", "auth"),
        makeEdge("e7", "agent", "trace"),
        makeEdge("e8", "e2e", "prompts"),
        makeEdge("e9", "router", "e2e", "deploy gate"),
      ]
    ),
    rationale:
      "Router + auth tenancy, guardrails on agent I/O, traces, and e2e eval gates before prompt/model deploys.",
  };
}

function agenticEvalDriven(): SeasonPrompt {
  return {
    id: "season-eval-driven-agents",
    title: "Eval-Driven Agent Improvement",
    difficulty: "medium",
    track: "agentic",
    summary: "Close the loop: traces → span/e2e evals → prompt changes.",
    description:
      "Design how a team measures agent quality, finds regressions, and safely ships prompt/model updates.",
    requirements: [
      "Collect traces/spans",
      "Span-level evals",
      "E2e golden set evals",
      "Prompt registry with versions",
      "Regression gate before release",
    ],
    constraints: {
      other: ["Must support classic + agentic products"],
      latencySla: "Eval suite overnight OK",
    },
    evaluationFocus: ["span_eval", "e2e_eval", "trace_collector", "prompt_registry"],
    referenceDesign: makeGraph(
      [
        makeNode("agent", "agent", { x: 0, y: 100 }),
        makeNode("trace", "trace_collector", { x: 180, y: 100 }),
        makeNode("span", "span_eval", { x: 360, y: 40 }),
        makeNode("e2e", "e2e_eval", { x: 360, y: 160 }),
        makeNode("prompts", "prompt_registry", { x: 540, y: 100 }),
        makeNode("orch", "workflow_orchestrator", { x: 720, y: 100 }),
        makeNode("human", "human_review", { x: 540, y: 200 }),
      ],
      [
        makeEdge("e1", "agent", "trace"),
        makeEdge("e2", "trace", "span"),
        makeEdge("e3", "trace", "e2e"),
        makeEdge("e4", "span", "prompts", "regressions"),
        makeEdge("e5", "e2e", "prompts"),
        makeEdge("e6", "prompts", "orch", "canary deploy"),
        makeEdge("e7", "orch", "human", "approve"),
      ]
    ),
    rationale:
      "Traces feed span + e2e evals; results drive prompt registry versions with orchestrated human-gated rollout.",
  };
}

function classicObservability(): SeasonPrompt {
  return {
    id: "season-observability-stack",
    title: "Observability for Microservices",
    difficulty: "medium",
    track: "classic",
    summary: "Metrics, logs, and traces for a microservice fleet.",
    description:
      "Design an observability stack: RED/USE metrics, structured logs, distributed traces, and alert routing.",
    requirements: [
      "Metrics + dashboards",
      "Centralized logging",
      "Distributed tracing",
      "Alerting on SLOs",
      "Low overhead on services",
    ],
    constraints: {
      expectedQps: "High cardinality careful",
      dataVolume: "TB/day telemetry",
      latencySla: "Trace ingest near-real-time",
    },
    evaluationFocus: ["metrics", "logs", "traces", "cardinality"],
    referenceDesign: makeGraph(
      [
        makeNode("svc", "microservice", { x: 0, y: 100 }),
        makeNode("mon", "monitoring", { x: 200, y: 20 }),
        makeNode("log", "logging", { x: 200, y: 100 }),
        makeNode("tr", "tracing", { x: 200, y: 180 }),
        makeNode("ts", "time_series_db", { x: 400, y: 20 }),
        makeNode("obj", "object_storage", { x: 400, y: 100 }),
        makeNode("q", "pubsub", { x: 100, y: 200 }),
      ],
      [
        makeEdge("e1", "svc", "mon"),
        makeEdge("e2", "svc", "log"),
        makeEdge("e3", "svc", "tr"),
        makeEdge("e4", "mon", "ts"),
        makeEdge("e5", "log", "obj"),
        makeEdge("e6", "svc", "q", "events"),
      ]
    ),
    rationale:
      "Three pillars with TSDB for metrics and object storage for log retention; pubsub for async event export.",
  };
}

function classicQueuePipeline(): SeasonPrompt {
  return {
    id: "season-async-email-pipeline",
    title: "Async Notification Pipeline",
    difficulty: "easy",
    track: "classic",
    summary: "Decouple user actions from email/SMS delivery with retries and DLQ.",
    description:
      "After signup or order events, send notifications reliably without blocking the request path.",
    requirements: [
      "Async queue between API and workers",
      "Retries with backoff",
      "Dead-letter queue",
      "Idempotent send",
      "Observe lag and failures",
    ],
    constraints: {
      expectedQps: "2k events/sec peak",
      latencySla: "Email within 60s p99",
      availability: "At-least-once OK",
    },
    evaluationFocus: ["queue", "workers", "DLQ", "idempotency"],
    referenceDesign: makeGraph(
      [
        makeNode("api", "app_server", { x: 0, y: 80 }),
        makeNode(
          "q",
          "message_queue",
          { x: 200, y: 80 },
          { dlq: true }
        ),
        makeNode("worker", "worker", { x: 400, y: 80 }),
        makeNode("fn", "serverless", { x: 600, y: 80 }),
        makeNode("mon", "monitoring", { x: 400, y: 180 }),
      ],
      [
        makeEdge("e1", "api", "q", "enqueue"),
        makeEdge("e2", "q", "worker"),
        makeEdge("e3", "worker", "fn", "provider send"),
        makeEdge("e4", "worker", "mon"),
      ]
    ),
    rationale:
      "API enqueues; workers send with DLQ-backed queue; monitoring tracks lag and failures.",
  };
}

/** Exactly 20 prompts for season pack v1 (14 classic + 6 agentic). */
export function buildOfflineSeasonPrompts(): SeasonPrompt[] {
  return [
    classicUrlShortener(),
    classicKv(),
    classicRateLimiter(),
    classicChat(),
    classicNewsFeed(),
    classicIdGen(),
    classicRideShare(),
    classicVideo(),
    classicPayments(),
    classicMultiTenant(),
    classicSearch(),
    classicCdnStatic(),
    classicObservability(),
    classicQueuePipeline(),
    agenticRag(),
    agenticResearch(),
    agenticMultiAgent(),
    agenticCoding(),
    agenticEnterprise(),
    agenticEvalDriven(),
  ];
}
