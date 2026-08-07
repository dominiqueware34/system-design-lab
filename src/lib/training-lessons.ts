import type { DiagramId } from "@/components/diagrams/ConceptDiagrams";
import {
  defaultAttributes,
  getComponentByType,
} from "@/lib/component-catalog";
import type { DesignNodeData } from "@/lib/types";
import type { Edge, Node } from "@xyflow/react";

export type TrainingTopic =
  | "latency"
  | "scaling"
  | "redundancy"
  | "async"
  | "agentic";

export interface TrainingLesson {
  id: string;
  title: string;
  topic: TrainingTopic;
  order: number;
  summary: string;
  scenario: string;
  /** What the user should place */
  objective: string;
  keywords: string[];
  tips: string[];
  teaches: string;
  diagramId: DiagramId;
  /** All of these types must appear as *new* nodes (not only starters) */
  requiredTypes: string[];
  requireEdgeFrom?: string;
  requireEdgeTo?: string;
  starterNodes: Array<{
    id: string;
    componentType: string;
    label?: string;
    x: number;
    y: number;
    locked?: boolean;
  }>;
  starterEdges: Array<{ id: string; source: string; target: string }>;
  successMessage: string;
  /**
   * Where to put the missing piece (flow coords).
   * If omitted, computed from starter graph + edge requirements.
   */
  hintPosition?: { x: number; y: number };
  /** Human placement guidance; if omitted, computed */
  placementHint?: string;
}

export interface ToolCheatSheetEntry {
  id: string;
  name: string;
  componentTypes: string[];
  whenToUse: string;
  keywords: string[];
  antiPatterns: string;
  diagramId?: DiagramId;
  relatedLessonIds: string[];
}

export const TOPIC_META: Record<
  TrainingTopic,
  { label: string; color: string; description: string }
> = {
  latency: {
    label: "Latency",
    color: "text-amber-400",
    description: "Caches, CDN, fast read paths under p99 SLAs.",
  },
  scaling: {
    label: "Scaling",
    color: "text-sky-400",
    description: "Horizontal scale, sharding, read replicas, load balancers.",
  },
  redundancy: {
    label: "Redundancy",
    color: "text-emerald-400",
    description: "Survive failures: multi-AZ, replicas, no SPOF.",
  },
  async: {
    label: "Async & reliability",
    color: "text-pink-400",
    description: "Queues, workers, retries, dead-letter queues.",
  },
  agentic: {
    label: "Agentic / RAG",
    color: "text-violet-400",
    description: "Models, tools, multi-step loops, retrieval, evals.",
  },
};

export const TRAINING_LESSONS: TrainingLesson[] = [
  // ── Latency ──────────────────────────────────────────
  {
    id: "add-cache",
    title: "Add a cache for hot reads",
    topic: "latency",
    order: 1,
    summary: "DB + app are slow under read load — drop in a cache.",
    scenario:
      "Your app and SQL database are live. Product reports p99 read latency is 400ms and the DB CPU is pegged. The same product pages are hit over and over.",
    objective: "Add a Cache between the app and the database, and connect App → Cache.",
    keywords: [
      "hot reads",
      "p99",
      "latency",
      "cache",
      "repeated queries",
      "QPS",
      "read-heavy",
    ],
    tips: [
      "Cache sits on the read path (cache-aside is the most common interview pattern).",
      "Use TTL + eviction (LRU) so stale data expires.",
      "Plan invalidation (or short TTLs) when writes update the same keys.",
    ],
    teaches:
      "A cache stores frequent results in memory so most requests never hit the database — the first tool when reads dominate and data is reusable.",
    diagramId: "cache",
    requiredTypes: ["cache"],
    requireEdgeFrom: "app",
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 120, locked: true },
      { id: "app", componentType: "app_server", label: "App Server", x: 260, y: 120, locked: true },
      {
        id: "db",
        componentType: "sql_database",
        label: "Primary SQL",
        x: 500,
        y: 120,
        locked: true,
      },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "app" },
      { id: "e2", source: "app", target: "db" },
    ],
    successMessage:
      "Wire App → Cache for reads; on miss App → DB, then fill the cache. That’s cache-aside.",
  },
  {
    id: "add-cdn",
    title: "Put media on a CDN",
    topic: "latency",
    order: 2,
    summary: "Global users wait on images — edge cache them.",
    scenario:
      "Object storage holds images/videos. Users on other continents wait multi-seconds. Origin bandwidth bills are climbing.",
    objective: "Add a CDN and place it on the path toward users / media.",
    keywords: ["CDN", "global", "images", "video", "static assets", "edge", "TTFB"],
    tips: [
      "CDN caches at PoPs near users; origin only on miss.",
      "Pair with object storage (S3) for durable blobs.",
      "Versioned URLs + cache headers make deploys safe.",
    ],
    teaches:
      "A CDN serves static/media from the edge so users don’t pull every byte from one origin region.",
    diagramId: "cdn",
    requiredTypes: ["cdn"],
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 120, locked: true },
      { id: "app", componentType: "app_server", x: 260, y: 120, locked: true },
      {
        id: "s3",
        componentType: "object_storage",
        label: "Object storage",
        x: 500,
        y: 120,
        locked: true,
      },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "app" },
      { id: "e2", source: "app", target: "s3" },
    ],
    successMessage:
      "CDN in front of origin (or static routes) is the fix. Clients load media from the edge.",
  },

  // ── Scaling ──────────────────────────────────────────
  {
    id: "add-load-balancer",
    title: "Scale out with a load balancer",
    topic: "scaling",
    order: 3,
    summary: "One app box can’t take the traffic — put an LB in front.",
    scenario:
      "Single app server + database. Traffic is 10× last month. Vertical scaling is maxed.",
    objective: "Add a Load Balancer and connect it to the app (Client → LB → App).",
    keywords: [
      "scale out",
      "horizontal",
      "high traffic",
      "replicas",
      "load balancer",
      "multi-instance",
    ],
    tips: [
      "Keep app servers stateless so any replica can serve any request.",
      "Enable health checks so dead nodes leave the pool.",
      "Next step after LB: more app replicas behind it.",
    ],
    teaches:
      "A load balancer spreads traffic across many identical instances so you scale by adding machines.",
    diagramId: "load_balancer",
    requiredTypes: ["load_balancer"],
    requireEdgeTo: "app",
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 140, locked: true },
      {
        id: "app",
        componentType: "app_server",
        label: "App (only one!)",
        x: 320,
        y: 140,
        locked: true,
      },
      { id: "db", componentType: "sql_database", x: 560, y: 140, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "app" },
      { id: "e2", source: "app", target: "db" },
    ],
    successMessage:
      "LB sits between Client and App. Clone more app replicas behind the same LB in a full design.",
  },
  {
    id: "add-read-replicas",
    title: "Offload reads with replicas",
    topic: "scaling",
    order: 4,
    summary: "Primary DB is read-bound — add read capacity.",
    scenario:
      "Writes are fine, but dashboards and feeds hammer primary SQL. Read/write ≈ 100:1.",
    objective: "Add a second SQL Database node as a read replica.",
    keywords: [
      "read replica",
      "read-heavy",
      "reporting",
      "analytics",
      "feed",
      "scale reads",
    ],
    tips: [
      "Writes → primary; most reads → replicas.",
      "Replicas lag slightly — OK for feeds, not for money “read your write”.",
      "Combine with cache for hottest keys.",
    ],
    teaches:
      "Read replicas copy data so many servers serve SELECTs while one primary takes writes.",
    diagramId: "read_replica",
    requiredTypes: ["sql_database"],
    starterNodes: [
      { id: "app", componentType: "app_server", x: 80, y: 120, locked: true },
      {
        id: "primary",
        componentType: "sql_database",
        label: "Primary (writes)",
        x: 360,
        y: 120,
        locked: true,
      },
    ],
    starterEdges: [{ id: "e1", source: "app", target: "primary" }],
    successMessage:
      "Second SQL node = read replica. On the primary, set replication and readReplicas in attributes.",
  },
  {
    id: "add-sharding",
    title: "Shard when one DB isn’t enough",
    topic: "scaling",
    order: 5,
    summary: "Data or write QPS exceeds one primary — partition by key.",
    scenario:
      "Your SQL primary already has read replicas and a cache, but storage and write QPS still climb. Interviewer: “What when one machine can’t hold the dataset?”",
    objective:
      "Add a NoSQL (or extra SQL) store with partitioning in mind — place a sharded data store on the canvas.",
    keywords: [
      "shard",
      "partition",
      "too large",
      "consistent hashing",
      "tenant_id",
      "user_id",
      "hot key",
    ],
    tips: [
      "Pick a shard key that spreads load (user_id / tenant_id) and avoids hot partitions.",
      "Consistent hashing reduces data movement when nodes join/leave.",
      "Cross-shard transactions are hard — design to avoid them.",
    ],
    teaches:
      "Sharding splits data across many nodes by a partition key so capacity scales beyond a single database.",
    diagramId: "sharding",
    requiredTypes: ["nosql_database"],
    starterNodes: [
      { id: "lb", componentType: "load_balancer", x: 40, y: 100, locked: true },
      { id: "app", componentType: "app_server", x: 240, y: 100, locked: true },
      {
        id: "cache",
        componentType: "cache",
        label: "Cache",
        x: 440,
        y: 40,
        locked: true,
      },
      {
        id: "sql",
        componentType: "sql_database",
        label: "SQL (struggling)",
        x: 440,
        y: 160,
        locked: true,
      },
    ],
    starterEdges: [
      { id: "e1", source: "lb", target: "app" },
      { id: "e2", source: "app", target: "cache" },
      { id: "e3", source: "app", target: "sql" },
    ],
    successMessage:
      "A partitioned NoSQL (or sharded SQL) store is the right instinct. Set partitioning + hashing attributes on the new node.",
  },
  {
    id: "add-rate-limiter",
    title: "Protect APIs with rate limiting",
    topic: "scaling",
    order: 6,
    summary: "Abuse or noisy clients overwhelm the API — throttle them.",
    scenario:
      "Public API sits behind a gateway. One client’s script is 50% of traffic and error rates spike for everyone else.",
    objective: "Add a Rate Limiter on the edge path (near gateway / clients).",
    keywords: ["rate limit", "quota", "abuse", "429", "throttle", "fair use", "DDoS"],
    tips: [
      "Token bucket / sliding window are common algorithms.",
      "Scope limits per user, API key, or IP.",
      "Fail open vs fail closed is a product decision under limiter outage.",
    ],
    teaches:
      "A rate limiter enforces quotas so one client can’t starve the rest of the system.",
    diagramId: "rate_limiter",
    requiredTypes: ["rate_limiter"],
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 120, locked: true },
      { id: "gw", componentType: "api_gateway", label: "API Gateway", x: 260, y: 120, locked: true },
      { id: "app", componentType: "app_server", x: 500, y: 120, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "gw" },
      { id: "e2", source: "gw", target: "app" },
    ],
    successMessage:
      "Rate limiter near the gateway (or as part of it) protects downstream capacity.",
  },

  // ── Redundancy ───────────────────────────────────────
  {
    id: "add-multi-az-lb",
    title: "Redundancy: multi-AZ load balancer",
    topic: "redundancy",
    order: 7,
    summary: "One AZ dies — traffic should fail over.",
    scenario:
      "App and DB live in a single zone. Interviewer: “What if the AZ is gone for an hour?”",
    objective: "Add a Load Balancer and enable multi-AZ thinking on the path.",
    keywords: [
      "multi-AZ",
      "availability zone",
      "HA",
      "failover",
      "99.9%",
      "redundancy",
      "SPOF",
    ],
    tips: [
      "App replicas in 2+ AZs behind a multi-AZ LB.",
      "DB: multi-AZ standby or regional replicas.",
      "Health checks + auto-replace unhealthy nodes.",
    ],
    teaches:
      "Spreading LB + compute across AZs removes whole-building single points of failure.",
    diagramId: "multi_az",
    requiredTypes: ["load_balancer"],
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 140, locked: true },
      {
        id: "app",
        componentType: "app_server",
        label: "App (single AZ)",
        x: 300,
        y: 140,
        locked: true,
      },
      { id: "db", componentType: "sql_database", x: 540, y: 140, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "app" },
      { id: "e2", source: "app", target: "db" },
    ],
    successMessage:
      "LB is the multi-AZ front door. Flip multiAz on the LB; set app region strategy to Multi-AZ.",
  },
  {
    id: "add-replica-failover",
    title: "DB standby for failover",
    topic: "redundancy",
    order: 8,
    summary: "Primary DB is a SPOF — add a standby replica.",
    scenario:
      "Payments path writes to one SQL primary. Ops asks what happens mid-write if the primary disk dies.",
    objective: "Add another SQL Database as a multi-AZ / standby replica.",
    keywords: [
      "failover",
      "standby",
      "primary dies",
      "RPO",
      "RTO",
      "sync replica",
      "multi-AZ DB",
    ],
    tips: [
      "Sync multi-AZ for money; async replicas for read scale.",
      "App should reconnect via DNS / proxy after failover.",
      "Test failover — untested HA is fiction.",
    ],
    teaches:
      "A standby database replica can take over if the primary fails, protecting durability and availability.",
    diagramId: "multi_az",
    requiredTypes: ["sql_database"],
    starterNodes: [
      { id: "app", componentType: "app_server", x: 80, y: 120, locked: true },
      {
        id: "primary",
        componentType: "sql_database",
        label: "Primary only",
        x: 360,
        y: 120,
        locked: true,
      },
    ],
    starterEdges: [{ id: "e1", source: "app", target: "primary" }],
    successMessage:
      "Second SQL = standby. Set replication to Sync multi-AZ (or similar) on the primary attributes.",
  },

  // ── Async ────────────────────────────────────────────
  {
    id: "add-queue",
    title: "Offload slow work to a queue",
    topic: "async",
    order: 9,
    summary: "API waits on email/video work — make it async.",
    scenario:
      "Signup API sends a welcome email inline. p99 is 3s and timeouts spike when the mail provider is slow.",
    objective: "Add a Message Queue (and ideally connect App → Queue).",
    keywords: [
      "async",
      "background job",
      "email",
      "slow dependency",
      "decouple",
      "spike",
      "queue",
    ],
    tips: [
      "API enqueues work and returns 202/200 quickly.",
      "Workers scale independently of web tier.",
      "Always plan retries + DLQ next.",
    ],
    teaches:
      "A message queue buffers work so the API doesn’t block on slow or spiky tasks.",
    diagramId: "queue_worker",
    requiredTypes: ["message_queue"],
    requireEdgeFrom: "app",
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 120, locked: true },
      { id: "app", componentType: "app_server", label: "Signup API", x: 280, y: 120, locked: true },
    ],
    starterEdges: [{ id: "e1", source: "client", target: "app" }],
    successMessage:
      "Queue absorbs the email job. Next: Worker consumes it; DLQ catches poison messages.",
  },
  {
    id: "add-worker",
    title: "Consume the queue with a worker",
    topic: "async",
    order: 10,
    summary: "Jobs sit in a queue — add a consumer.",
    scenario:
      "You have an API and a jobs queue, but nothing processes messages. Backlog grows forever.",
    objective: "Add a Background Worker and connect Queue → Worker.",
    keywords: ["worker", "consumer", "process jobs", "background", "subscriber"],
    tips: [
      "Workers should be idempotent — at-least-once delivery is common.",
      "Scale worker replicas with queue depth.",
      "Visibility timeout / ack after success.",
    ],
    teaches:
      "Workers (consumers) pull jobs from the queue and perform the real work out of band.",
    diagramId: "queue_worker",
    requiredTypes: ["worker"],
    requireEdgeFrom: "q",
    starterNodes: [
      { id: "app", componentType: "app_server", label: "API", x: 40, y: 120, locked: true },
      {
        id: "q",
        componentType: "message_queue",
        label: "Jobs queue",
        x: 280,
        y: 120,
        locked: true,
      },
    ],
    starterEdges: [{ id: "e1", source: "app", target: "q" }],
    successMessage:
      "Worker drains the queue. Set retryPolicy to exponential backoff on the worker.",
  },
  {
    id: "add-dlq",
    title: "Protect workers with a DLQ",
    topic: "async",
    order: 11,
    summary: "Bad messages poison the queue — add a dead-letter queue.",
    scenario:
      "Queue + worker process webhooks. Some messages fail forever and clog retries for good jobs.",
    objective: "Add a second Message Queue as the Dead-Letter Queue.",
    keywords: [
      "dead letter",
      "DLQ",
      "poison message",
      "retries",
      "async",
      "webhook",
      "failed jobs",
    ],
    tips: [
      "Main queue = happy path. DLQ = after N failed receives.",
      "Alert on DLQ depth — that’s your ops signal.",
      "Enable dlq attribute on the main queue in full designs.",
    ],
    teaches:
      "A dead-letter queue isolates poison messages so one bad payload doesn’t stall every consumer.",
    diagramId: "dlq",
    requiredTypes: ["message_queue"],
    starterNodes: [
      { id: "app", componentType: "app_server", label: "API", x: 40, y: 100, locked: true },
      {
        id: "q",
        componentType: "message_queue",
        label: "Jobs queue",
        x: 280,
        y: 100,
        locked: true,
      },
      { id: "worker", componentType: "worker", label: "Worker", x: 520, y: 100, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "app", target: "q" },
      { id: "e2", source: "q", target: "worker" },
    ],
    successMessage:
      "Second queue = DLQ. Failed jobs land there after retries instead of blocking the fleet.",
  },

  // ── Agentic ──────────────────────────────────────────
  {
    id: "add-rag",
    title: "Ground the LLM with RAG",
    topic: "agentic",
    order: 12,
    summary: "Chatbot invents policy answers — add retrieval.",
    scenario:
      "Chat UI + agent + LLM answer HR policy from memory and sometimes invent rules.",
    objective: "Add both a RAG Retriever tool and a Vector Database.",
    keywords: [
      "RAG",
      "retrieval",
      "knowledge base",
      "documents",
      "hallucination",
      "cite",
      "vector",
      "embeddings",
    ],
    tips: [
      "Pipeline: embed docs → vector DB → top-K → prompt.",
      "Cite chunks; refuse when retrieval is weak.",
      "Hybrid search helps when queries include IDs.",
    ],
    teaches:
      "RAG retrieves your document chunks at query time so answers are grounded, not pure model memory.",
    diagramId: "naive_rag",
    requiredTypes: ["tool_rag", "vector_db"],
    starterNodes: [
      { id: "client", componentType: "web_client", label: "Chat UI", x: 40, y: 100, locked: true },
      { id: "agent", componentType: "agent", label: "Support agent", x: 240, y: 100, locked: true },
      { id: "llm", componentType: "llm_model", label: "LLM", x: 460, y: 100, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "agent" },
      { id: "e2", source: "agent", target: "llm" },
    ],
    successMessage:
      "Agent → RAG → Vector DB, then LLM with context. That’s naive RAG.",
  },
  {
    id: "add-hybrid-rag-hint",
    title: "Hybrid search when keywords matter",
    topic: "agentic",
    order: 13,
    summary: "Vector-only RAG misses ticket IDs — go hybrid.",
    scenario:
      "RAG has agent + vector retriever. Users search “INC-10492” and get wrong chunks.",
    objective: "Add a Search Index (BM25 / keyword) alongside vectors.",
    keywords: [
      "hybrid",
      "BM25",
      "keyword",
      "exact match",
      "ticket id",
      "SKU",
      "error code",
    ],
    tips: [
      "Vectors = meaning. Keywords = exact tokens.",
      "Merge + rerank both lists before the LLM.",
    ],
    teaches:
      "Hybrid RAG runs keyword and vector retrieval together — best when queries mix language and identifiers.",
    diagramId: "hybrid_rag",
    requiredTypes: ["search_index"],
    starterNodes: [
      { id: "agent", componentType: "agent", x: 40, y: 80, locked: true },
      {
        id: "rag",
        componentType: "tool_rag",
        label: "Vector retriever",
        x: 260,
        y: 40,
        locked: true,
      },
      { id: "vdb", componentType: "vector_db", x: 480, y: 40, locked: true },
      { id: "llm", componentType: "llm_model", x: 260, y: 180, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "agent", target: "rag" },
      { id: "e2", source: "rag", target: "vdb" },
      { id: "e3", source: "agent", target: "llm" },
    ],
    successMessage:
      "Search index = keyword half of hybrid RAG. Wire it into the retriever path.",
  },
  {
    id: "add-web-search",
    title: "Live facts need web search",
    topic: "agentic",
    order: 14,
    summary: "Model knowledge is stale — give it a web search tool.",
    scenario:
      "Research agent only has an LLM. Users ask about news from this week and get outdated answers.",
    objective: "Add a Web Search Tool and connect Agent → Web Search.",
    keywords: [
      "current events",
      "today",
      "news",
      "live data",
      "web search",
      "knowledge cutoff",
    ],
    tips: [
      "Web search ≠ RAG. RAG = your corpus; web = public internet.",
      "Cap steps and cite sources from results.",
      "Tool output must feed back into the next LLM turn.",
    ],
    teaches:
      "A web search tool fetches live public information the model doesn’t know from training alone.",
    diagramId: "web_search",
    requiredTypes: ["tool_web_search"],
    requireEdgeFrom: "agent",
    starterNodes: [
      { id: "client", componentType: "web_client", x: 40, y: 100, locked: true },
      { id: "agent", componentType: "agent", label: "Research agent", x: 260, y: 100, locked: true },
      { id: "llm", componentType: "llm_model", x: 480, y: 100, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "client", target: "agent" },
      { id: "e2", source: "agent", target: "llm" },
    ],
    successMessage:
      "Agent → Web search → results back into LLM. That’s the multi-step tool loop.",
  },
  {
    id: "add-tool-loop",
    title: "Close the tool feedback loop",
    topic: "agentic",
    order: 15,
    summary: "Agent calls tools but never uses results — wire the loop.",
    scenario:
      "You have agent, LLM, and a code executor. Results never return to the model, so it can’t fix failed tests.",
    objective: "Connect Worker/tool path: ensure Code Executor is linked from the agent.",
    keywords: [
      "tool loop",
      "ReAct",
      "multi-step",
      "feedback",
      "retry after error",
      "code exec",
    ],
    tips: [
      "Every tool result is a new observation for the LLM.",
      "Cap maxSteps to control cost/latency.",
      "Parallel tool calls when subtasks are independent.",
    ],
    teaches:
      "Agentic systems work by looping: plan → tool → observe result → plan again until done.",
    diagramId: "agent_tool_loop",
    requiredTypes: ["tool_code_exec"],
    requireEdgeFrom: "agent",
    starterNodes: [
      { id: "agent", componentType: "agent", label: "Coding agent", x: 120, y: 80, locked: true },
      { id: "llm", componentType: "llm_model", x: 360, y: 80, locked: true },
    ],
    starterEdges: [{ id: "e1", source: "agent", target: "llm" }],
    successMessage:
      "Code executor on the agent closes the loop: run tests → read output → fix → repeat.",
  },
  {
    id: "add-evals",
    title: "Measure quality with evals",
    topic: "agentic",
    order: 16,
    summary: "Ship agents without metrics — add span or e2e evals.",
    scenario:
      "Production support agent exists with RAG + LLM. Leadership asks: “How do we know a prompt change made answers worse?”",
    objective: "Add either Span Eval or E2E Task Eval (and ideally a Trace Collector).",
    keywords: [
      "eval",
      "measure",
      "regression",
      "golden set",
      "LLM-as-judge",
      "quality",
      "span",
      "e2e",
    ],
    tips: [
      "Span evals = step quality (retrieval, tool choice).",
      "E2E evals = whole task success on golden sets.",
      "Gate deploys on e2e; sample spans continuously.",
    ],
    teaches:
      "Evals tell you whether agent quality improved or regressed — design them like any other production subsystem.",
    diagramId: "evals",
    requiredTypes: ["e2e_eval"],
    starterNodes: [
      { id: "agent", componentType: "agent", x: 80, y: 80, locked: true },
      { id: "rag", componentType: "tool_rag", x: 280, y: 40, locked: true },
      { id: "llm", componentType: "llm_model", x: 280, y: 140, locked: true },
    ],
    starterEdges: [
      { id: "e1", source: "agent", target: "rag" },
      { id: "e2", source: "agent", target: "llm" },
    ],
    successMessage:
      "E2E eval (plus optional span eval + traces) answers “did we get worse?” after prompt/model changes.",
  },
];

/** Quick reference: when interview keywords → which tool */
export const TOOL_CHEATSHEET: ToolCheatSheetEntry[] = [
  {
    id: "cache",
    name: "Cache (Redis)",
    componentTypes: ["cache"],
    whenToUse: "Same data read often; p99 latency SLA; DB CPU high on repeats.",
    keywords: ["hot key", "p99", "latency", "cache", "read-heavy", "session"],
    antiPatterns: "Don’t cache highly unique one-off queries or strong consistency money paths without a plan.",
    diagramId: "cache",
    relatedLessonIds: ["add-cache"],
  },
  {
    id: "cdn",
    name: "CDN",
    componentTypes: ["cdn"],
    whenToUse: "Static/media assets to global users; cut origin egress.",
    keywords: ["images", "video", "global", "static", "edge", "TTFB"],
    antiPatterns: "Not a substitute for dynamic personalized API caching (use app cache/API CDN carefully).",
    diagramId: "cdn",
    relatedLessonIds: ["add-cdn"],
  },
  {
    id: "lb",
    name: "Load balancer",
    componentTypes: ["load_balancer"],
    whenToUse: "Multiple app instances; HA; health-checked fan-out.",
    keywords: ["scale out", "replicas", "high traffic", "multi-AZ", "SPOF"],
    antiPatterns: "LB alone without multiple healthy backends does nothing.",
    diagramId: "load_balancer",
    relatedLessonIds: ["add-load-balancer", "add-multi-az-lb"],
  },
  {
    id: "read-replica",
    name: "Read replicas",
    componentTypes: ["sql_database"],
    whenToUse: "Read QPS >> write QPS; reporting/feeds off primary.",
    keywords: ["read replica", "read-heavy", "analytics", "100:1"],
    antiPatterns: "Not for strong read-your-writes money paths without careful routing.",
    diagramId: "read_replica",
    relatedLessonIds: ["add-read-replicas", "add-replica-failover"],
  },
  {
    id: "shard",
    name: "Sharding / NoSQL partition",
    componentTypes: ["nosql_database", "sql_database"],
    whenToUse: "Dataset or write QPS exceeds one primary even with replicas.",
    keywords: ["shard", "partition", "consistent hashing", "tenant", "too big"],
    antiPatterns: "Sharding too early; bad shard keys that create hot partitions.",
    diagramId: "sharding",
    relatedLessonIds: ["add-sharding"],
  },
  {
    id: "rate-limit",
    name: "Rate limiter",
    componentTypes: ["rate_limiter"],
    whenToUse: "Public APIs, abuse, multi-tenant fairness, quota products.",
    keywords: ["quota", "429", "abuse", "throttle", "DDoS", "fair use"],
    antiPatterns: "Only in-app limits without shared store across instances.",
    diagramId: "rate_limiter",
    relatedLessonIds: ["add-rate-limiter"],
  },
  {
    id: "queue",
    name: "Message queue",
    componentTypes: ["message_queue"],
    whenToUse: "Slow/spiky work; decouple producers; absorb bursts.",
    keywords: ["async", "email", "webhook", "background", "decouple", "spike"],
    antiPatterns: "Using a queue when the client must wait for the final result synchronously.",
    diagramId: "queue_worker",
    relatedLessonIds: ["add-queue"],
  },
  {
    id: "worker",
    name: "Background worker",
    componentTypes: ["worker"],
    whenToUse: "Something must consume the queue and do the work.",
    keywords: ["consumer", "process jobs", "worker", "subscriber"],
    antiPatterns: "Workers without idempotency under at-least-once delivery.",
    diagramId: "queue_worker",
    relatedLessonIds: ["add-worker"],
  },
  {
    id: "dlq",
    name: "Dead-letter queue",
    componentTypes: ["message_queue"],
    whenToUse: "Poison messages / infinite retries after N failures.",
    keywords: ["DLQ", "dead letter", "poison", "failed jobs", "retries exhausted"],
    antiPatterns: "Retries forever with no DLQ or alerting.",
    diagramId: "dlq",
    relatedLessonIds: ["add-dlq"],
  },
  {
    id: "rag",
    name: "RAG + vector DB",
    componentTypes: ["tool_rag", "vector_db"],
    whenToUse: "Answers must come from your docs/knowledge base.",
    keywords: ["RAG", "knowledge base", "documents", "hallucination", "cite"],
    antiPatterns: "Stuffing entire corpus into the prompt with no retrieval.",
    diagramId: "naive_rag",
    relatedLessonIds: ["add-rag", "add-hybrid-rag-hint"],
  },
  {
    id: "web-search",
    name: "Web search tool",
    componentTypes: ["tool_web_search"],
    whenToUse: "Need live public info beyond model cutoff / private RAG.",
    keywords: ["today", "news", "current", "live", "web search"],
    antiPatterns: "Web search for private company docs (use RAG instead).",
    diagramId: "web_search",
    relatedLessonIds: ["add-web-search"],
  },
  {
    id: "evals",
    name: "Span / E2E evals",
    componentTypes: ["span_eval", "e2e_eval", "trace_collector"],
    whenToUse: "Need to know if agent quality regressed after a change.",
    keywords: ["eval", "golden set", "regression", "measure", "LLM-as-judge"],
    antiPatterns: "Shipping prompt changes with only vibe checks.",
    diagramId: "evals",
    relatedLessonIds: ["add-evals"],
  },
];

export function getLesson(id: string): TrainingLesson | undefined {
  return TRAINING_LESSONS.find((l) => l.id === id);
}

/**
 * Text + canvas coordinates for the "drop it here" ghost marker.
 */
export function getPlacementGuide(lesson: TrainingLesson): {
  text: string;
  position: { x: number; y: number };
  between?: { fromLabel: string; toLabel: string };
} {
  const byId = Object.fromEntries(lesson.starterNodes.map((n) => [n.id, n]));
  const labelOf = (id: string) => {
    const n = byId[id];
    if (!n) return id;
    return n.label ?? getComponentByType(n.componentType)?.label ?? id;
  };
  const typeLabels = lesson.requiredTypes
    .map((t) => getComponentByType(t)?.label ?? t)
    .join(" + ");

  if (lesson.placementHint && lesson.hintPosition) {
    return { text: lesson.placementHint, position: lesson.hintPosition };
  }

  // Between source and its existing target (e.g. App → DB → put cache in middle)
  if (lesson.requireEdgeFrom && byId[lesson.requireEdgeFrom]) {
    const from = byId[lesson.requireEdgeFrom];
    const edge = lesson.starterEdges.find((e) => e.source === lesson.requireEdgeFrom);
    if (edge && byId[edge.target]) {
      const to = byId[edge.target];
      const position = lesson.hintPosition ?? {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2 + 70,
      };
      const fromLabel = labelOf(from.id);
      const toLabel = labelOf(to.id);
      return {
        text:
          lesson.placementHint ??
          `Drop ${typeLabels} here — between “${fromLabel}” and “${toLabel}”, then connect ${fromLabel} → it.`,
        position,
        between: { fromLabel, toLabel },
      };
    }
    const position = lesson.hintPosition ?? {
      x: from.x + 40,
      y: from.y + 120,
    };
    return {
      text:
        lesson.placementHint ??
        `Drop ${typeLabels} below “${labelOf(from.id)}”, then connect ${labelOf(from.id)} → it.`,
      position,
    };
  }

  // Upstream of a target (e.g. LB before App)
  if (lesson.requireEdgeTo && byId[lesson.requireEdgeTo]) {
    const to = byId[lesson.requireEdgeTo];
    const edge = lesson.starterEdges.find((e) => e.target === lesson.requireEdgeTo);
    if (edge && byId[edge.source]) {
      const from = byId[edge.source];
      const position = lesson.hintPosition ?? {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2 - 20,
      };
      return {
        text:
          lesson.placementHint ??
          `Drop ${typeLabels} here — between “${labelOf(from.id)}” and “${labelOf(to.id)}”, then connect it → ${labelOf(to.id)}.`,
        position,
        between: { fromLabel: labelOf(from.id), toLabel: labelOf(to.id) },
      };
    }
    const position = lesson.hintPosition ?? { x: to.x - 180, y: to.y };
    return {
      text:
        lesson.placementHint ??
        `Drop ${typeLabels} to the left of “${labelOf(to.id)}”, then connect it → ${labelOf(to.id)}.`,
      position,
    };
  }

  // Default: to the right / below the cluster of starters
  const nodes = lesson.starterNodes;
  const maxX = Math.max(...nodes.map((n) => n.x));
  const avgY = nodes.reduce((s, n) => s + n.y, 0) / Math.max(nodes.length, 1);
  const position = lesson.hintPosition ?? { x: maxX + 40, y: avgY + 100 };
  return {
    text:
      lesson.placementHint ??
      `Drop ${typeLabels} on the glowing “Drop here” marker on the canvas.`,
    position,
  };
}

export function lessonsSorted(): TrainingLesson[] {
  return [...TRAINING_LESSONS].sort((a, b) => a.order - b.order);
}

export function nextLesson(currentId: string): TrainingLesson | undefined {
  const sorted = lessonsSorted();
  const idx = sorted.findIndex((l) => l.id === currentId);
  if (idx < 0 || idx >= sorted.length - 1) return undefined;
  return sorted[idx + 1];
}

export function prevLesson(currentId: string): TrainingLesson | undefined {
  const sorted = lessonsSorted();
  const idx = sorted.findIndex((l) => l.id === currentId);
  if (idx <= 0) return undefined;
  return sorted[idx - 1];
}

export function buildStarterGraph(lesson: TrainingLesson): {
  nodes: Node<DesignNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<DesignNodeData>[] = lesson.starterNodes.map((n) => {
    const def = getComponentByType(n.componentType);
    if (!def) throw new Error(`Unknown component type: ${n.componentType}`);
    return {
      id: n.id,
      type: "design",
      position: { x: n.x, y: n.y },
      data: {
        componentType: def.type,
        label: n.label ?? def.label,
        category: def.category,
        color: def.color,
        icon: def.icon,
        attributes: defaultAttributes(def),
        locked: n.locked ?? true,
      },
      deletable: !(n.locked ?? true),
    };
  });

  const edges: Edge[] = lesson.starterEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: true,
    style: { stroke: "#71717a", strokeWidth: 1.5 },
  }));

  return { nodes, edges };
}

export function checkLessonProgress(
  lesson: TrainingLesson,
  nodes: Node<DesignNodeData>[],
  edges: Edge[]
): { complete: boolean; missing: string[]; hint: string; found: string[] } {
  const starterIds = new Set(lesson.starterNodes.map((n) => n.id));
  const userNodes = nodes.filter((n) => !starterIds.has(n.id));

  const found = lesson.requiredTypes.filter((t) =>
    userNodes.some((n) => n.data.componentType === t)
  );
  const missing = lesson.requiredTypes.filter((t) => !found.includes(t));

  if (missing.length > 0) {
    return {
      complete: false,
      missing,
      found,
      hint:
        lesson.objective ||
        `Add from the palette: ${missing.join(" + ")} (new node${missing.length > 1 ? "s" : ""}).`,
    };
  }

  if (lesson.requireEdgeFrom) {
    const ok = edges.some((e) => {
      if (e.source !== lesson.requireEdgeFrom) return false;
      const target = nodes.find((n) => n.id === e.target);
      return (
        !!target &&
        (userNodes.some((n) => n.id === e.target) ||
          lesson.requiredTypes.includes(target.data.componentType))
      );
    });
    if (!ok) {
      return {
        complete: false,
        missing: [],
        found,
        hint: `Connect ${lesson.requireEdgeFrom} → your new component.`,
      };
    }
  }

  if (lesson.requireEdgeTo) {
    const ok = edges.some((e) => {
      if (e.target !== lesson.requireEdgeTo) return false;
      const source = nodes.find((n) => n.id === e.source);
      return (
        !!source &&
        (userNodes.some((n) => n.id === e.source) ||
          lesson.requiredTypes.includes(source.data.componentType))
      );
    });
    if (!ok) {
      return {
        complete: false,
        missing: [],
        found,
        hint: `Connect your new component → ${lesson.requireEdgeTo}.`,
      };
    }
  }

  return {
    complete: true,
    missing: [],
    found,
    hint: lesson.successMessage,
  };
}

// ── Progress (localStorage) ────────────────────────────

const PROGRESS_KEY = "sdl-training-progress-v1";

export interface TrainingProgress {
  completedLessonIds: string[];
  lastLessonId?: string;
}

export function defaultTrainingProgress(): TrainingProgress {
  return { completedLessonIds: [] };
}

export function loadTrainingProgress(): TrainingProgress {
  if (typeof window === "undefined") return defaultTrainingProgress();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultTrainingProgress();
    const p = JSON.parse(raw) as TrainingProgress;
    return {
      completedLessonIds: p.completedLessonIds ?? [],
      lastLessonId: p.lastLessonId,
    };
  } catch {
    return defaultTrainingProgress();
  }
}

export function saveTrainingProgress(progress: TrainingProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function markLessonComplete(lessonId: string): TrainingProgress {
  const p = loadTrainingProgress();
  if (!p.completedLessonIds.includes(lessonId)) {
    p.completedLessonIds.push(lessonId);
  }
  p.lastLessonId = lessonId;
  saveTrainingProgress(p);
  return p;
}

export function resetTrainingProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
}
