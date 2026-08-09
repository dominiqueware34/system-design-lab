import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeEdge, makeGraph, makeNode } from "@/lib/design-graph-builder";
import { validateDesignGraph } from "@/lib/design-graph-validate";
import type { DesignGraph } from "@/lib/types";

describe("validateDesignGraph", () => {
  it("accepts a valid catalog-backed graph", () => {
    const graph = makeGraph(
      [
        makeNode("c1", "web_client", { x: 0, y: 0 }),
        makeNode("lb", "load_balancer", { x: 200, y: 0 }),
        makeNode(
          "app",
          "app_server",
          { x: 400, y: 0 },
          { replicas: 3 }
        ),
        makeNode(
          "db",
          "sql_database",
          { x: 600, y: 0 },
          {
            engine: "PostgreSQL",
            replication: "Async replicas",
            sharding: false,
          }
        ),
      ],
      [
        makeEdge("e1", "c1", "lb"),
        makeEdge("e2", "lb", "app"),
        makeEdge("e3", "app", "db", "SQL"),
      ]
    );

    const result = validateDesignGraph(graph);
    assert.equal(result.ok, true, JSON.stringify(result.issues, null, 2));
    assert.equal(result.issues.length, 0);
  });

  it("fails on unknown component type", () => {
    const graph: DesignGraph = {
      nodes: [
        {
          id: "x1",
          type: "not_a_real_component",
          position: { x: 0, y: 0 },
          data: {
            componentType: "not_a_real_component",
            label: "Fake",
            category: "compute",
            color: "#fff",
            icon: "x",
            attributes: {},
          },
        },
      ],
      edges: [],
    };

    const result = validateDesignGraph(graph);
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((i) => i.code === "unknown_type"),
      `expected unknown_type, got ${JSON.stringify(result.issues)}`
    );
  });

  it("fails on bad select attribute enum", () => {
    const graph = makeGraph(
      [
        makeNode(
          "db",
          "sql_database",
          { x: 0, y: 0 },
          // engine must be one of PostgreSQL | MySQL | SQL Server | CockroachDB
          { engine: "Oracle-Enterprise" as unknown as string }
        ),
      ],
      []
    );

    const result = validateDesignGraph(graph);
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((i) => i.code === "bad_enum"),
      `expected bad_enum, got ${JSON.stringify(result.issues)}`
    );
  });

  it("fails on number out of range", () => {
    const graph = makeGraph(
      [
        makeNode(
          "db",
          "sql_database",
          { x: 0, y: 0 },
          { sizeGb: 0 } // min 1
        ),
      ],
      []
    );

    const result = validateDesignGraph(graph);
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "bad_number"));
  });

  it("fails when edge references missing node", () => {
    const graph = makeGraph(
      [makeNode("a", "web_client", { x: 0, y: 0 })],
      [makeEdge("e1", "a", "missing")]
    );

    const result = validateDesignGraph(graph);
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "invalid_edge"));
  });

  it("fails on null / missing graph", () => {
    const result = validateDesignGraph(null);
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "invalid_graph"));
  });
});
