import type { Edge, Node } from "@xyflow/react";
import type { DesignGraph, DesignNodeData, SerializedEdge, SerializedNode } from "./types";

export function serializeDesign(
  nodes: Node<DesignNodeData>[],
  edges: Edge[]
): DesignGraph {
  const serializedNodes: SerializedNode[] = nodes.map((node) => ({
    id: node.id,
    type: node.data.componentType,
    position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
    data: {
      componentType: node.data.componentType,
      label: node.data.label,
      category: node.data.category,
      color: node.data.color,
      icon: node.data.icon,
      attributes: { ...node.data.attributes },
    },
  }));

  const serializedEdges: SerializedEdge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: typeof edge.label === "string" ? edge.label : undefined,
  }));

  return { nodes: serializedNodes, edges: serializedEdges };
}

export function designSummary(graph: DesignGraph): string {
  const types = graph.nodes.map((n) => n.type);
  const unique = [...new Set(types)];
  return `${graph.nodes.length} components (${unique.join(", ") || "none"}), ${graph.edges.length} connections`;
}
