/**
 * Helpers to build valid DesignGraph nodes from COMPONENT_CATALOG.
 * Used by offline season-prompt generation and tests.
 */

import {
  defaultAttributes,
  getComponentByType,
} from "@/lib/component-catalog";
import type {
  AttributeValue,
  DesignGraph,
  SerializedEdge,
  SerializedNode,
} from "@/lib/types";

export function makeNode(
  id: string,
  componentType: string,
  position: { x: number; y: number },
  attributeOverrides: Record<string, AttributeValue> = {},
  labelOverride?: string
): SerializedNode {
  const def = getComponentByType(componentType);
  if (!def) {
    throw new Error(`Unknown component type: ${componentType}`);
  }
  return {
    id,
    type: componentType,
    position,
    data: {
      componentType,
      label: labelOverride ?? def.label,
      category: def.category,
      color: def.color,
      icon: def.icon,
      attributes: { ...defaultAttributes(def), ...attributeOverrides },
    },
  };
}

export function makeEdge(
  id: string,
  source: string,
  target: string,
  label?: string
): SerializedEdge {
  return { id, source, target, label };
}

export function makeGraph(
  nodes: SerializedNode[],
  edges: SerializedEdge[]
): DesignGraph {
  return { nodes, edges };
}
