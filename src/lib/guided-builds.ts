import {
  defaultAttributes,
  getComponentByType,
} from "@/lib/component-catalog";
import type { DesignNodeData } from "@/lib/types";
import type { Edge, Node } from "@xyflow/react";
import type { TrainingTopic } from "@/lib/training-lessons";

export interface GuidedStep {
  /** Unique within the build */
  id: string;
  /** Short title for the step list */
  title: string;
  /** Why we add this piece — spoken coach copy */
  why: string;
  /** What problem this solves / interview framing */
  because: string;
  /** Optional keywords that would trigger this choice */
  keywords?: string[];
  /** Nodes added at this step */
  addNodes: Array<{
    id: string;
    componentType: string;
    label?: string;
    x: number;
    y: number;
  }>;
  /** Edges added at this step (ids must already exist or be added this step) */
  addEdges?: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
  /** Drop edges that no longer apply (e.g. client→app once LB is inserted) */
  removeEdges?: string[];
  /** Optional attribute overrides after place */
  setAttributes?: Array<{
    nodeId: string;
    attributes: Record<string, string | number | boolean>;
  }>;
}

export interface GuidedBuild {
  id: string;
  title: string;
  summary: string;
  topic: TrainingTopic;
  /** Interview-style problem this solves */
  problem: string;
  /** Final architecture one-liner */
  outcome: string;
  steps: GuidedStep[];
}

export const GUIDED_BUILDS: GuidedBuild[] = [
  {
    id: "url-shortener-core",
    title: "URL shortener (core path)",
    summary: "Client → CDN/edge ideas → API → cache → DB, step by step.",
    topic: "latency",
    problem:
      "Design a URL shortener: create short links, redirect fast, handle high read QPS.",
    outcome:
      "Read-heavy path is cached; writes go to a durable store; edge reduces latency for redirects.",
    steps: [
      {
        id: "s1",
        title: "Web client",
        why: "Someone has to hit the service — browsers and apps are the entry point for create and redirect.",
        because: "Without a client, there is no request path to design.",
        keywords: ["users", "browser", "mobile"],
        addNodes: [
          {
            id: "client",
            componentType: "web_client",
            label: "Browser / app",
            x: 40,
            y: 160,
          },
        ],
      },
      {
        id: "s2",
        title: "API / app servers",
        why: "Business logic lives here: validate URLs, mint short codes, look up mappings.",
        because: "Keep clients thin; put create + redirect orchestration in a stateless app tier you can scale out.",
        keywords: ["API", "stateless", "backend"],
        addNodes: [
          {
            id: "app",
            componentType: "app_server",
            label: "Shortener API",
            x: 280,
            y: 160,
          },
        ],
        addEdges: [{ id: "e-c-a", source: "client", target: "app", label: "HTTPS" }],
        setAttributes: [
          {
            nodeId: "app",
            attributes: { stateless: true, replicas: 3, autoScale: true },
          },
        ],
      },
      {
        id: "s3",
        title: "Primary database",
        why: "Short code → long URL must be durable. A DB (or KV) is the source of truth for mappings.",
        because: "Caches die; you still need a persistent store for every short link you ever created.",
        keywords: ["durable", "mapping", "source of truth"],
        addNodes: [
          {
            id: "db",
            componentType: "sql_database",
            label: "URL mapping DB",
            x: 560,
            y: 220,
          },
        ],
        addEdges: [{ id: "e-a-db", source: "app", target: "db", label: "write / miss" }],
        setAttributes: [
          {
            nodeId: "db",
            attributes: { replication: "Async replicas", readReplicas: 1 },
          },
        ],
      },
      {
        id: "s4",
        title: "Cache for redirects",
        why: "Redirects are extremely read-heavy. A cache keeps hot short codes off the DB so p99 stays low.",
        because: "Interview keywords: hot reads, p99, same keys hit over and over.",
        keywords: ["cache", "p99", "hot key", "redirect QPS"],
        addNodes: [
          {
            id: "cache",
            componentType: "cache",
            label: "Redirect cache",
            x: 560,
            y: 80,
          },
        ],
        addEdges: [{ id: "e-a-cache", source: "app", target: "cache", label: "get / set" }],
        setAttributes: [
          {
            nodeId: "cache",
            attributes: { engine: "Redis", ttlSeconds: 3600, clustered: true },
          },
        ],
      },
      {
        id: "s5",
        title: "Load balancer",
        why: "Multiple API replicas need a single VIP. The LB spreads traffic and drops unhealthy nodes.",
        because: "Scale out + basic HA — never pin all traffic to one app box.",
        keywords: ["scale out", "replicas", "health checks"],
        addNodes: [
          {
            id: "lb",
            componentType: "load_balancer",
            label: "L7 LB",
            x: 160,
            y: 160,
          },
        ],
        removeEdges: ["e-c-a"],
        addEdges: [
          { id: "e-c-lb", source: "client", target: "lb" },
          { id: "e-lb-a", source: "lb", target: "app" },
        ],
        setAttributes: [
          {
            nodeId: "lb",
            attributes: { healthChecks: true, multiAz: true, layer: "L7" },
          },
        ],
      },
      {
        id: "s6",
        title: "Optional CDN (edge)",
        why: "For public redirects, an edge/CDN layer (or edge compute) can terminate TLS close to users and cache some responses.",
        because: "Global users + static-ish redirect responses → edge helps TTFB.",
        keywords: ["CDN", "global", "edge", "TTFB"],
        addNodes: [
          {
            id: "cdn",
            componentType: "cdn",
            label: "Edge / CDN",
            x: 40,
            y: 40,
          },
        ],
        addEdges: [{ id: "e-cdn-lb", source: "cdn", target: "lb", label: "miss → origin" }],
      },
    ],
  },
  {
    id: "async-email-pipeline",
    title: "Async jobs: queue, worker, DLQ",
    summary: "Don’t block the API on email — buffer, process, isolate poison.",
    topic: "async",
    problem:
      "Signup must send welcome email, but the mail provider is slow and sometimes fails forever on bad addresses.",
    outcome:
      "API stays fast; workers absorb load; DLQ holds poison messages for humans/ops.",
    steps: [
      {
        id: "s1",
        title: "API that accepts signup",
        why: "The synchronous path only needs to validate input and persist the user — not send email inline.",
        because: "Keeping the request path short protects p99 when a dependency is slow.",
        addNodes: [
          {
            id: "client",
            componentType: "web_client",
            label: "Signup UI",
            x: 40,
            y: 120,
          },
          {
            id: "api",
            componentType: "app_server",
            label: "Signup API",
            x: 240,
            y: 120,
          },
        ],
        addEdges: [{ id: "e1", source: "client", target: "api" }],
      },
      {
        id: "s2",
        title: "Message queue",
        why: "Enqueue “send welcome email” and return 200 immediately. The queue absorbs spikes if signups burst.",
        because: "Keywords: async, background job, decouple, spike traffic.",
        keywords: ["async", "queue", "background", "spike"],
        addNodes: [
          {
            id: "q",
            componentType: "message_queue",
            label: "Email jobs",
            x: 460,
            y: 120,
          },
        ],
        addEdges: [{ id: "e2", source: "api", target: "q", label: "enqueue" }],
        setAttributes: [
          {
            nodeId: "q",
            attributes: { delivery: "At-least-once", dlq: true },
          },
        ],
      },
      {
        id: "s3",
        title: "Worker consumers",
        why: "Workers pull jobs and call the mail provider. Scale workers with queue depth, independent of the web tier.",
        because: "Producers and consumers scale separately — classic queue pattern.",
        keywords: ["worker", "consumer", "process jobs"],
        addNodes: [
          {
            id: "worker",
            componentType: "worker",
            label: "Email worker",
            x: 680,
            y: 120,
          },
        ],
        addEdges: [{ id: "e3", source: "q", target: "worker", label: "consume" }],
        setAttributes: [
          {
            nodeId: "worker",
            attributes: {
              retryPolicy: "Exponential backoff",
              replicas: 3,
            },
          },
        ],
      },
      {
        id: "s4",
        title: "Dead-letter queue",
        why: "After N failed receives, park the message in a DLQ so one bad address doesn’t block the whole consumer fleet.",
        because: "Keywords: poison message, DLQ, retries exhausted, failed jobs.",
        keywords: ["DLQ", "poison", "dead letter"],
        addNodes: [
          {
            id: "dlq",
            componentType: "message_queue",
            label: "Email DLQ",
            x: 680,
            y: 280,
          },
        ],
        addEdges: [
          { id: "e4", source: "worker", target: "dlq", label: "after N fails" },
        ],
      },
      {
        id: "s5",
        title: "User store",
        why: "Signup still needs a durable user record before or with the enqueue — the queue is for side effects, not the only source of truth.",
        because: "Async side effects ≠ losing the write of the user row.",
        addNodes: [
          {
            id: "db",
            componentType: "sql_database",
            label: "Users DB",
            x: 240,
            y: 280,
          },
        ],
        addEdges: [{ id: "e5", source: "api", target: "db", label: "insert user" }],
      },
    ],
  },
  {
    id: "read-heavy-scale",
    title: "Scale a read-heavy app",
    summary: "LB → app replicas → cache → primary + read replica.",
    topic: "scaling",
    problem:
      "Product pages are read-heavy (100:1 R/W). One app box and one DB are maxed out.",
    outcome:
      "Horizontal app scale, cache for hot keys, replicas for read QPS off the primary.",
    steps: [
      {
        id: "s1",
        title: "Clients + single app (pain)",
        why: "Start from the broken baseline so each fix is motivated.",
        because: "Interviews often evolve a simple design under more load.",
        addNodes: [
          {
            id: "client",
            componentType: "web_client",
            x: 40,
            y: 140,
          },
          {
            id: "app",
            componentType: "app_server",
            label: "App v1 (1 box)",
            x: 280,
            y: 140,
          },
          {
            id: "db",
            componentType: "sql_database",
            label: "Primary SQL",
            x: 540,
            y: 140,
          },
        ],
        addEdges: [
          { id: "e1", source: "client", target: "app" },
          { id: "e2", source: "app", target: "db" },
        ],
      },
      {
        id: "s2",
        title: "Load balancer + scale out",
        why: "Add an LB and treat app as a fleet. Stateless replicas absorb traffic.",
        because: "Vertical scaling hit a wall → horizontal scale.",
        keywords: ["scale out", "load balancer", "replicas"],
        addNodes: [
          {
            id: "lb",
            componentType: "load_balancer",
            x: 160,
            y: 140,
          },
          {
            id: "app2",
            componentType: "app_server",
            label: "App replica",
            x: 280,
            y: 280,
          },
        ],
        removeEdges: ["e1"],
        addEdges: [
          { id: "e3", source: "client", target: "lb" },
          { id: "e4", source: "lb", target: "app" },
          { id: "e5", source: "lb", target: "app2" },
          { id: "e6", source: "app2", target: "db" },
        ],
        setAttributes: [
          {
            nodeId: "app",
            attributes: { replicas: 3, stateless: true, autoScale: true },
          },
        ],
      },
      {
        id: "s3",
        title: "Cache hot product pages",
        why: "Same product IDs are requested constantly. Cache-aside cuts DB QPS and p99.",
        because: "Keywords: hot reads, cache, p99 latency.",
        keywords: ["cache", "hot reads", "p99"],
        addNodes: [
          {
            id: "cache",
            componentType: "cache",
            label: "Product cache",
            x: 540,
            y: 20,
          },
        ],
        addEdges: [
          { id: "e7", source: "app", target: "cache" },
          { id: "e8", source: "app2", target: "cache" },
        ],
      },
      {
        id: "s4",
        title: "Read replica",
        why: "Remaining DB reads (cache misses, lists) go to replicas so the primary focuses on writes.",
        because: "Keywords: read-heavy, 100:1, reporting, feed.",
        keywords: ["read replica", "read-heavy"],
        addNodes: [
          {
            id: "replica",
            componentType: "sql_database",
            label: "Read replica",
            x: 720,
            y: 140,
          },
        ],
        addEdges: [
          { id: "e9", source: "db", target: "replica", label: "async repl" },
          { id: "e10", source: "app", target: "replica", label: "reads" },
        ],
        setAttributes: [
          {
            nodeId: "db",
            attributes: { readReplicas: 2, replication: "Async replicas" },
          },
        ],
      },
    ],
  },
  {
    id: "rag-support-bot",
    title: "RAG support agent",
    summary: "Client → agent → RAG/vector → LLM, with evals.",
    topic: "agentic",
    problem:
      "Support bot must answer from internal docs without inventing policy.",
    outcome:
      "Retrieval grounds the model; traces/evals catch quality regressions.",
    steps: [
      {
        id: "s1",
        title: "Chat client + agent",
        why: "The agent owns the loop: decide when to retrieve, call tools, then answer.",
        because: "Separate UI from orchestration so you can swap models/tools.",
        addNodes: [
          {
            id: "client",
            componentType: "web_client",
            label: "Chat UI",
            x: 40,
            y: 140,
          },
          {
            id: "agent",
            componentType: "agent",
            label: "Support agent",
            x: 260,
            y: 140,
          },
        ],
        addEdges: [{ id: "e1", source: "client", target: "agent" }],
        setAttributes: [
          {
            nodeId: "agent",
            attributes: { pattern: "ReAct", maxSteps: 6, memoryEnabled: true },
          },
        ],
      },
      {
        id: "s2",
        title: "Pick a model",
        why: "Explicit model choice is a design decision: cost, latency, quality trade-offs.",
        because: "Interviews increasingly expect you to say which model class and why.",
        keywords: ["model selection", "latency", "cost"],
        addNodes: [
          {
            id: "llm",
            componentType: "llm_model",
            label: "LLM",
            x: 480,
            y: 40,
          },
        ],
        addEdges: [{ id: "e2", source: "agent", target: "llm", label: "generate" }],
        setAttributes: [
          {
            nodeId: "llm",
            attributes: { model: "grok-4.5", temperature: 0.2 },
          },
        ],
      },
      {
        id: "s3",
        title: "Knowledge base + embeddings path",
        why: "Docs must be chunked and embedded offline so retrieval is fast at query time.",
        because: "Without an index of your corpus, the model only has parametric memory.",
        addNodes: [
          {
            id: "kb",
            componentType: "knowledge_base",
            label: "Policy docs",
            x: 40,
            y: 300,
          },
          {
            id: "indexer",
            componentType: "document_indexer",
            label: "Chunk + embed",
            x: 240,
            y: 300,
          },
        ],
        addEdges: [{ id: "e3", source: "kb", target: "indexer" }],
      },
      {
        id: "s4",
        title: "Vector DB + RAG tool",
        why: "At query time the agent calls RAG: top-K similar chunks become prompt context.",
        because: "Keywords: RAG, knowledge base, reduce hallucination, cite sources.",
        keywords: ["RAG", "vector", "retrieval", "hallucination"],
        addNodes: [
          {
            id: "vdb",
            componentType: "vector_db",
            label: "Vector index",
            x: 440,
            y: 300,
          },
          {
            id: "rag",
            componentType: "tool_rag",
            label: "RAG retriever",
            x: 480,
            y: 180,
          },
        ],
        addEdges: [
          { id: "e4", source: "indexer", target: "vdb", label: "upsert" },
          { id: "e5", source: "agent", target: "rag", label: "retrieve" },
          { id: "e6", source: "rag", target: "vdb", label: "top-K" },
        ],
        setAttributes: [
          {
            nodeId: "rag",
            attributes: { topK: 5, searchType: "Hybrid", rerank: true },
          },
        ],
      },
      {
        id: "s5",
        title: "Tool result → LLM again",
        why: "The loop matters: retrieve first, then generate with citations. Edges show feedback into the model.",
        because: "Agentic design is multi-step: tool output is the next observation.",
        keywords: ["tool loop", "multi-step", "ReAct"],
        addNodes: [],
        addEdges: [
          { id: "e7", source: "rag", target: "llm", label: "context" },
        ],
      },
      {
        id: "s6",
        title: "Evals + traces",
        why: "After ship, you must know if a prompt change hurt answer quality — span and e2e evals + traces.",
        because: "Keywords: regression, golden set, measure, LLM-as-judge.",
        keywords: ["eval", "golden set", "regression"],
        addNodes: [
          {
            id: "e2e",
            componentType: "e2e_eval",
            label: "E2E eval suite",
            x: 700,
            y: 100,
          },
          {
            id: "trace",
            componentType: "trace_collector",
            label: "Traces",
            x: 700,
            y: 220,
          },
        ],
        addEdges: [
          { id: "e8", source: "agent", target: "trace" },
          { id: "e9", source: "agent", target: "e2e" },
        ],
      },
    ],
  },
  {
    id: "ha-multi-az",
    title: "High availability multi-AZ",
    summary: "Remove SPOFs: multi-AZ LB, app fleet, standby DB.",
    topic: "redundancy",
    problem:
      "“What if the availability zone dies for an hour?” on a single-zone app + DB.",
    outcome: "Traffic and data survive an AZ loss with failover and health checks.",
    steps: [
      {
        id: "s1",
        title: "Baseline SPOF design",
        why: "Show the risk: one AZ, one app, one DB.",
        because: "Redundancy is motivated by a concrete failure mode.",
        addNodes: [
          {
            id: "client",
            componentType: "web_client",
            x: 40,
            y: 160,
          },
          {
            id: "app",
            componentType: "app_server",
            label: "App (AZ-a only)",
            x: 280,
            y: 160,
          },
          {
            id: "db",
            componentType: "sql_database",
            label: "Primary (AZ-a)",
            x: 520,
            y: 160,
          },
        ],
        addEdges: [
          { id: "e1", source: "client", target: "app" },
          { id: "e2", source: "app", target: "db" },
        ],
      },
      {
        id: "s2",
        title: "Multi-AZ load balancer",
        why: "Regional LB with health checks is the front door that can shift traffic when an AZ fails.",
        because: "Keywords: multi-AZ, HA, failover, 99.9%.",
        keywords: ["multi-AZ", "HA", "failover"],
        addNodes: [
          {
            id: "lb",
            componentType: "load_balancer",
            label: "Multi-AZ LB",
            x: 160,
            y: 160,
          },
        ],
        removeEdges: ["e1"],
        addEdges: [
          { id: "e3", source: "client", target: "lb" },
          { id: "e4", source: "lb", target: "app" },
        ],
        setAttributes: [
          {
            nodeId: "lb",
            attributes: { multiAz: true, healthChecks: true },
          },
        ],
      },
      {
        id: "s3",
        title: "App in a second AZ",
        why: "Run replicas in AZ-b so losing AZ-a doesn’t zero capacity.",
        because: "LB only helps if healthy backends exist in other zones.",
        addNodes: [
          {
            id: "app-b",
            componentType: "app_server",
            label: "App (AZ-b)",
            x: 280,
            y: 300,
          },
        ],
        addEdges: [
          { id: "e5", source: "lb", target: "app-b" },
          { id: "e6", source: "app-b", target: "db" },
        ],
        setAttributes: [
          {
            nodeId: "app",
            attributes: { region: "Multi-AZ", replicas: 3 },
          },
          {
            nodeId: "app-b",
            attributes: { region: "Multi-AZ", replicas: 3 },
          },
        ],
      },
      {
        id: "s4",
        title: "Standby database",
        why: "Sync or multi-AZ standby so storage survives primary disk/AZ loss.",
        because: "Compute HA without data HA is still an outage.",
        keywords: ["standby", "failover", "RPO"],
        addNodes: [
          {
            id: "standby",
            componentType: "sql_database",
            label: "Standby (AZ-b)",
            x: 520,
            y: 300,
          },
        ],
        addEdges: [
          { id: "e7", source: "db", target: "standby", label: "repl" },
        ],
        setAttributes: [
          {
            nodeId: "db",
            attributes: { replication: "Sync multi-AZ" },
          },
        ],
      },
    ],
  },
];

export function getGuidedBuild(id: string): GuidedBuild | undefined {
  return GUIDED_BUILDS.find((b) => b.id === id);
}

export function graphThroughStep(
  build: GuidedBuild,
  stepIndex: number
): { nodes: Node<DesignNodeData>[]; edges: Edge[] } {
  const nodeMap = new Map<string, Node<DesignNodeData>>();
  const edgeMap = new Map<string, Edge>();

  const upto = Math.min(stepIndex, build.steps.length - 1);
  for (let i = 0; i <= upto; i++) {
    const step = build.steps[i];
    for (const n of step.addNodes) {
      const def = getComponentByType(n.componentType);
      if (!def) continue;
      nodeMap.set(n.id, {
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
        },
      });
    }
    for (const id of step.removeEdges ?? []) {
      edgeMap.delete(id);
    }
    for (const e of step.addEdges ?? []) {
      edgeMap.set(e.id, {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: "#71717a", strokeWidth: 1.5 },
      });
    }
    for (const patch of step.setAttributes ?? []) {
      const node = nodeMap.get(patch.nodeId);
      if (node) {
        node.data = {
          ...node.data,
          attributes: { ...node.data.attributes, ...patch.attributes },
        };
      }
    }
  }

  // Highlight nodes added on the current step
  const currentIds = new Set(build.steps[upto]?.addNodes.map((n) => n.id) ?? []);
  for (const [id, node] of nodeMap) {
    if (currentIds.has(id)) {
      node.data = { ...node.data, highlight: true };
      node.style = {
        ...node.style,
        boxShadow: "0 0 0 2px #38bdf8",
      };
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };
}
