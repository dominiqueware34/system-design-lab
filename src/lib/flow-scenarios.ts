import type { Edge, Node } from "@xyflow/react";
import type { ComponentCategory, DesignNodeData } from "@/lib/types";
import {
  DEFAULT_DWELL_MS,
  DEFAULT_HOP_MS,
  type FlowHop,
  type FlowScenario,
  type FlowScenarioSpec,
} from "@/lib/flow-types";

type DesignNode = Node<DesignNodeData>;

function nodeData(n: DesignNode): DesignNodeData {
  return n.data;
}

function isCache(n: DesignNode): boolean {
  const d = nodeData(n);
  return d.componentType === "cache" || d.label.toLowerCase().includes("cache");
}

function isQueue(n: DesignNode): boolean {
  const d = nodeData(n);
  return (
    d.componentType === "message_queue" ||
    d.category === "messaging" ||
    d.label.toLowerCase().includes("queue") ||
    d.label.toLowerCase().includes("dlq")
  );
}

function isWorker(n: DesignNode): boolean {
  const d = nodeData(n);
  return (
    d.componentType === "worker" ||
    d.label.toLowerCase().includes("worker") ||
    d.label.toLowerCase().includes("consumer")
  );
}

function isDb(n: DesignNode): boolean {
  const d = nodeData(n);
  return (
    d.componentType === "sql_database" ||
    d.componentType === "nosql_database" ||
    d.componentType === "kv_store" ||
    d.componentType === "vector_db" ||
    (d.category === "data" && !isCache(n))
  );
}

function isClient(n: DesignNode): boolean {
  return nodeData(n).category === "client";
}

function isEdgeTier(n: DesignNode): boolean {
  const cat = nodeData(n).category;
  return cat === "edge";
}

function isCompute(n: DesignNode): boolean {
  const cat = nodeData(n).category;
  return cat === "compute" || cat === "agent" || cat === "orchestration";
}

function isDlq(n: DesignNode): boolean {
  const label = nodeData(n).label.toLowerCase();
  return label.includes("dlq") || label.includes("dead");
}

/** Caption templates from hop endpoints (spec §6.2) */
export function captionForHop(
  from: DesignNode | undefined,
  to: DesignNode | undefined
): string {
  if (!from || !to) return "Request hops forward";
  const fromType = nodeData(from).componentType;
  const toType = nodeData(to).componentType;
  const fromCat = nodeData(from).category;
  const toCat = nodeData(to).category;
  const toLabel = nodeData(to).label;

  if (fromCat === "client" && (toCat === "edge" || toType === "load_balancer" || toType === "api_gateway")) {
    return "Client sends request";
  }
  if (fromCat === "client") {
    return `Client calls ${toLabel}`;
  }
  if (isCache(to)) {
    return "Check cache";
  }
  if (isCache(from) && isDb(to)) {
    return "Cache miss → load from DB";
  }
  if (isQueue(to) && !isDlq(to)) {
    return "Enqueue async work";
  }
  if (isQueue(from) && isWorker(to)) {
    return "Worker consumes message";
  }
  if (isWorker(from) && isDlq(to)) {
    return "Poison message → DLQ";
  }
  if (fromCat === "agent" && (toCat === "tools" || toType.startsWith("tool_"))) {
    return "Agent invokes tool";
  }
  if ((fromCat === "tools" || fromType.startsWith("tool_")) && (toCat === "agent" || toType === "llm_model")) {
    return "Tool result returns to model";
  }
  if (toType === "llm_model") {
    return "Call model for generation";
  }
  if (isDb(to)) {
    return `Read / write ${toLabel}`;
  }
  if (toType === "load_balancer") {
    return "Hit load balancer";
  }
  if (fromType === "load_balancer" && isCompute(to)) {
    return "LB routes to healthy instance";
  }
  if (toCat === "edge") {
    return `Pass through ${toLabel}`;
  }
  return `${nodeData(from).label} → ${toLabel}`;
}

function findEdge(
  edges: Edge[],
  fromId: string,
  toId: string
): Edge | undefined {
  return edges.find((e) => e.source === fromId && e.target === toId);
}

function buildAdjacency(edges: Edge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.source) ?? [];
    list.push(e.target);
    adj.set(e.source, list);
  }
  return adj;
}

function pickEntry(nodes: DesignNode[]): DesignNode | undefined {
  const clients = nodes.filter(isClient);
  if (clients.length > 0) {
    return [...clients].sort((a, b) => a.position.x - b.position.x)[0];
  }
  if (nodes.length === 0) return undefined;
  return [...nodes].sort((a, b) => a.position.x - b.position.x)[0];
}

/** Prefer BFS path with category preference scoring */
function findPreferredPath(
  entryId: string,
  adj: Map<string, string[]>,
  nodesById: Map<string, DesignNode>,
  prefer?: (n: DesignNode) => number,
  endWhen?: (n: DesignNode) => boolean,
  maxDepth = 12
): string[] | null {
  type Item = { id: string; path: string[]; score: number };
  const queue: Item[] = [{ id: entryId, path: [entryId], score: 0 }];
  const visited = new Set<string>([entryId]);
  let best: Item | null = null;

  while (queue.length > 0) {
    queue.sort((a, b) => b.score - a.score);
    const cur = queue.shift()!;
    const node = nodesById.get(cur.id);

    if (cur.path.length > 1 && node && endWhen?.(node)) {
      if (!best || cur.score > best.score || cur.path.length < best.path.length) {
        best = cur;
      }
      continue;
    }

    if (cur.path.length >= maxDepth) continue;

    for (const next of adj.get(cur.id) ?? []) {
      if (visited.has(next) && !endWhen) continue;
      if (cur.path.includes(next)) continue;
      const nNode = nodesById.get(next);
      const bonus = nNode && prefer ? prefer(nNode) : 0;
      const item: Item = {
        id: next,
        path: [...cur.path, next],
        score: cur.score + bonus + 1,
      };
      if (!endWhen) {
        // longest scored path for primary
        if (!best || item.score > best.score) best = item;
      }
      visited.add(next);
      queue.push(item);
    }
  }

  if (endWhen) return best?.path ?? null;

  // Primary: take best scored path ending at data/compute leaf-ish
  if (!best || best.path.length < 2) {
    // fallback: any BFS longest path
    const simple = bfsLongest(entryId, adj, maxDepth);
    return simple && simple.length >= 2 ? simple : null;
  }
  return best.path;
}

function bfsLongest(
  entryId: string,
  adj: Map<string, string[]>,
  maxDepth: number
): string[] | null {
  let best: string[] = [entryId];
  const q: string[][] = [[entryId]];
  while (q.length) {
    const path = q.shift()!;
    if (path.length > best.length) best = path;
    if (path.length >= maxDepth) continue;
    const last = path[path.length - 1];
    for (const next of adj.get(last) ?? []) {
      if (path.includes(next)) continue;
      q.push([...path, next]);
    }
  }
  return best.length >= 2 ? best : null;
}

function pathToHops(
  path: string[],
  edges: Edge[],
  nodesById: Map<string, DesignNode>
): FlowHop[] {
  const hops: FlowHop[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = findEdge(edges, from, to);
    if (!edge) continue;
    hops.push({
      edgeId: edge.id,
      fromNodeId: from,
      toNodeId: to,
      durationMs: DEFAULT_HOP_MS,
      nodeDwellMs: DEFAULT_DWELL_MS,
      caption: captionForHop(nodesById.get(from), nodesById.get(to)),
      highlightNodeIds: [from, to],
    });
  }
  return hops;
}

function categoryPrefer(n: DesignNode): number {
  if (isEdgeTier(n)) return 3;
  if (isCompute(n)) return 4;
  if (isCache(n)) return 2;
  if (isDb(n)) return 5;
  if (isQueue(n)) return 3;
  if (isWorker(n)) return 4;
  return 1;
}

/**
 * Deterministic heuristic scenarios for free design / campaign graphs.
 * Returns up to 3 scenarios; empty if no path from entry.
 */
export function buildHeuristicScenarios(
  nodes: DesignNode[],
  edges: Edge[]
): FlowScenario[] {
  if (nodes.length < 2 || edges.length < 1) return [];

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const adj = buildAdjacency(edges);
  const entry = pickEntry(nodes);
  if (!entry) return [];

  const scenarios: FlowScenario[] = [];

  // 1) Write / primary path
  const primaryPath = findPreferredPath(
    entry.id,
    adj,
    nodesById,
    categoryPrefer,
    undefined
  );
  if (primaryPath && primaryPath.length >= 2) {
    const hops = pathToHops(primaryPath, edges, nodesById);
    if (hops.length > 0) {
      scenarios.push({
        id: "primary",
        name: "Primary / write path",
        description: "Happy-path request from entry through the stack",
        hops,
        packetLabel: "REQ",
        packetKind: "request",
      });
    }
  }

  // 2) Read / cache path
  const caches = nodes.filter(isCache);
  if (caches.length > 0) {
    const cache = caches[0];
    const toCache = findPreferredPath(
      entry.id,
      adj,
      nodesById,
      (n) => (isCache(n) ? 10 : categoryPrefer(n)),
      (n) => n.id === cache.id
    );
    if (toCache && toCache.length >= 2) {
      let path = toCache;
      // optional extend cache → db
      const dbs = nodes.filter(isDb);
      for (const db of dbs) {
        const edge = findEdge(edges, cache.id, db.id);
        if (edge) {
          path = [...path, db.id];
          break;
        }
        // app → db after cache check is common; if path ends at cache via app, add app→db already separate
        const fromApp = path[path.length - 2];
        if (fromApp && findEdge(edges, fromApp, db.id)) {
          // cache miss branch: after cache, go to db from app
          path = [...path, db.id];
          // but path may not have edge cache→db; pathToHops skips missing edges
          // better: insert hop via app if needed
          break;
        }
      }

      // Fix cache-miss path: client…→app→cache then app→db as second leg via reconstructing hops
      const hops = pathToHops(path, edges, nodesById);
      // If last hop is to cache and app→db exists, append cache-miss style hop from app to db
      const lastTo = hops[hops.length - 1]?.toNodeId;
      if (lastTo && isCache(nodesById.get(lastTo)!)) {
        const appId = hops[hops.length - 1].fromNodeId;
        for (const db of dbs) {
          const e = findEdge(edges, appId, db.id);
          if (e) {
            hops.push({
              edgeId: e.id,
              fromNodeId: appId,
              toNodeId: db.id,
              durationMs: DEFAULT_HOP_MS,
              nodeDwellMs: DEFAULT_DWELL_MS,
              caption: "Cache miss → load from DB",
              highlightNodeIds: [appId, db.id, lastTo],
            });
            break;
          }
        }
      }

      if (hops.length > 0) {
        scenarios.push({
          id: "cache-read",
          name: "Read / cache path",
          description: "Look up hot data in cache, fall back to DB on miss",
          hops,
          packetLabel: "GET",
          packetKind: "request",
        });
      }
    }
  }

  // 3) Async path
  const queues = nodes.filter((n) => isQueue(n) && !isDlq(n));
  if (queues.length > 0) {
    const q = queues[0];
    const toQueue = findPreferredPath(
      entry.id,
      adj,
      nodesById,
      (n) => (isQueue(n) && !isDlq(n) ? 10 : categoryPrefer(n)),
      (n) => n.id === q.id
    );
    if (toQueue && toQueue.length >= 2) {
      let path = [...toQueue];
      // queue → worker
      const workers = nodes.filter(isWorker);
      for (const w of workers) {
        if (findEdge(edges, q.id, w.id)) {
          path.push(w.id);
          // worker → dlq optional
          const dlqs = nodes.filter(isDlq);
          for (const d of dlqs) {
            if (findEdge(edges, w.id, d.id)) {
              path.push(d.id);
              break;
            }
          }
          break;
        }
      }
      // also try any out-edge from queue
      if (path[path.length - 1] === q.id) {
        for (const next of adj.get(q.id) ?? []) {
          path.push(next);
          for (const next2 of adj.get(next) ?? []) {
            if (isDlq(nodesById.get(next2)!)) {
              path.push(next2);
              break;
            }
          }
          break;
        }
      }

      const hops = pathToHops(path, edges, nodesById);
      if (hops.length > 0) {
        scenarios.push({
          id: "async",
          name: "Async / queue path",
          description: "Background work through queue and worker",
          hops,
          packetLabel: "JOB",
          packetKind: "event",
        });
      }
    }
  }

  // Deduplicate by hop signature if primary === cache
  const seen = new Set<string>();
  const unique: FlowScenario[] = [];
  for (const s of scenarios) {
    const sig = s.hops.map((h) => h.edgeId).join(">");
    if (seen.has(sig)) continue;
    seen.add(sig);
    unique.push(s);
  }

  return unique.slice(0, 3);
}

/**
 * Resolve hand-authored hop specs (node id refs) against actual graph edges.
 * Skips hops with no matching edge.
 */
export function resolveScenarioSpecs(
  specs: FlowScenarioSpec[],
  nodes: DesignNode[],
  edges: Edge[]
): FlowScenario[] {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const out: FlowScenario[] = [];

  for (const spec of specs) {
    const hops: FlowHop[] = [];
    for (const h of spec.hops) {
      const edge = findEdge(edges, h.from, h.to);
      if (!edge) continue;
      hops.push({
        edgeId: edge.id,
        fromNodeId: h.from,
        toNodeId: h.to,
        durationMs: h.durationMs ?? DEFAULT_HOP_MS,
        nodeDwellMs: h.dwellMs ?? DEFAULT_DWELL_MS,
        caption: h.caption,
        highlightNodeIds: [h.from, h.to],
      });
    }
    if (hops.length === 0) continue;
    out.push({
      id: spec.id,
      name: spec.name,
      description: spec.description ?? "",
      hops,
      packetLabel: spec.packetLabel,
      packetKind: spec.packetKind,
    });
  }

  return out;
}

/** Prefer hand-authored; fall back to heuristic */
export function scenariosForGraph(
  nodes: DesignNode[],
  edges: Edge[],
  handAuthored?: FlowScenarioSpec[]
): FlowScenario[] {
  if (handAuthored && handAuthored.length > 0) {
    const resolved = resolveScenarioSpecs(handAuthored, nodes, edges);
    if (resolved.length > 0) return resolved;
  }
  return buildHeuristicScenarios(nodes, edges);
}

export type { ComponentCategory };
