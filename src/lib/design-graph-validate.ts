/**
 * Catalog-aware DesignGraph validation (Artifact 3).
 * Unknown component types and invalid select enums fail.
 * Plan B constraint math is intentionally out of scope.
 */

import {
  getComponentByType,
} from "@/lib/component-catalog";
import type {
  AttributeField,
  AttributeValue,
  DesignGraph,
  SerializedEdge,
  SerializedNode,
} from "@/lib/types";

export type DesignGraphIssueCode =
  | "invalid_graph"
  | "unknown_type"
  | "bad_enum"
  | "bad_number"
  | "bad_boolean"
  | "bad_text"
  | "bad_attribute_type"
  | "duplicate_node_id"
  | "invalid_edge"
  | "missing_node_field";

export interface DesignGraphIssue {
  path: string;
  code: DesignGraphIssueCode;
  message: string;
}

export interface DesignGraphValidationResult {
  ok: boolean;
  issues: DesignGraphIssue[];
}

function issue(
  path: string,
  code: DesignGraphIssueCode,
  message: string
): DesignGraphIssue {
  return { path, code, message };
}

function validateAttributeValue(
  path: string,
  field: AttributeField,
  value: AttributeValue
): DesignGraphIssue[] {
  const issues: DesignGraphIssue[] = [];

  switch (field.type) {
    case "select": {
      if (typeof value !== "string") {
        issues.push(
          issue(
            path,
            "bad_enum",
            `Expected string enum for "${field.key}", got ${typeof value}`
          )
        );
        break;
      }
      if (!field.options.includes(value)) {
        issues.push(
          issue(
            path,
            "bad_enum",
            `Invalid enum "${value}" for "${field.key}"; allowed: ${field.options.join(", ")}`
          )
        );
      }
      break;
    }
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        issues.push(
          issue(
            path,
            "bad_number",
            `Expected number for "${field.key}", got ${typeof value}`
          )
        );
        break;
      }
      if (field.min !== undefined && value < field.min) {
        issues.push(
          issue(
            path,
            "bad_number",
            `Value ${value} for "${field.key}" is below min ${field.min}`
          )
        );
      }
      if (field.max !== undefined && value > field.max) {
        issues.push(
          issue(
            path,
            "bad_number",
            `Value ${value} for "${field.key}" is above max ${field.max}`
          )
        );
      }
      break;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        issues.push(
          issue(
            path,
            "bad_boolean",
            `Expected boolean for "${field.key}", got ${typeof value}`
          )
        );
      }
      break;
    }
    case "text": {
      if (typeof value !== "string") {
        issues.push(
          issue(
            path,
            "bad_text",
            `Expected string for "${field.key}", got ${typeof value}`
          )
        );
      }
      break;
    }
    default: {
      issues.push(
        issue(path, "bad_attribute_type", `Unknown attribute field type`)
      );
    }
  }

  return issues;
}

function validateNode(
  node: SerializedNode,
  index: number,
  seenIds: Set<string>
): DesignGraphIssue[] {
  const issues: DesignGraphIssue[] = [];
  const base = `nodes[${index}]`;

  if (!node || typeof node !== "object") {
    return [issue(base, "invalid_graph", "Node must be an object")];
  }

  if (!node.id || typeof node.id !== "string") {
    issues.push(issue(`${base}.id`, "missing_node_field", "Node id is required"));
  } else if (seenIds.has(node.id)) {
    issues.push(
      issue(`${base}.id`, "duplicate_node_id", `Duplicate node id "${node.id}"`)
    );
  } else {
    seenIds.add(node.id);
  }

  const componentType =
    node.data?.componentType ?? (typeof node.type === "string" ? node.type : "");

  if (!componentType) {
    issues.push(
      issue(
        `${base}.data.componentType`,
        "missing_node_field",
        "componentType is required"
      )
    );
    return issues;
  }

  const def = getComponentByType(componentType);
  if (!def) {
    issues.push(
      issue(
        `${base}.data.componentType`,
        "unknown_type",
        `Unknown component type "${componentType}"`
      )
    );
    return issues;
  }

  // Prefer data.componentType matching catalog; node.type should align when present
  if (node.type && node.type !== componentType) {
    // soft consistency: if node.type is not the component type and not a flow type id
    // Design graphs in this app set type === componentType (see serialize-design)
    if (!getComponentByType(node.type) && node.type !== "designNode") {
      // only fail when type claims a different catalog id that doesn't match
      if (node.type !== componentType) {
        issues.push(
          issue(
            `${base}.type`,
            "unknown_type",
            `Node type "${node.type}" does not match componentType "${componentType}"`
          )
        );
      }
    }
  }

  const attributes = node.data?.attributes;
  if (attributes == null) {
    // empty attributes are allowed (defaults implied)
    return issues;
  }
  if (typeof attributes !== "object" || Array.isArray(attributes)) {
    issues.push(
      issue(
        `${base}.data.attributes`,
        "invalid_graph",
        "attributes must be an object"
      )
    );
    return issues;
  }

  const allowedKeys = new Set(def.attributes.map((a) => a.key));
  for (const [key, value] of Object.entries(attributes)) {
    const attrPath = `${base}.data.attributes.${key}`;
    if (!allowedKeys.has(key)) {
      // Extra keys are not fatal for v1 — only known attrs are validated when present
      // Keep strict on typed values that do exist in catalog
      continue;
    }
    const field = def.attributes.find((a) => a.key === key)!;
    issues.push(
      ...validateAttributeValue(attrPath, field, value as AttributeValue)
    );
  }

  return issues;
}

function validateEdge(
  edge: SerializedEdge,
  index: number,
  nodeIds: Set<string>
): DesignGraphIssue[] {
  const issues: DesignGraphIssue[] = [];
  const base = `edges[${index}]`;

  if (!edge || typeof edge !== "object") {
    return [issue(base, "invalid_edge", "Edge must be an object")];
  }
  if (!edge.id || typeof edge.id !== "string") {
    issues.push(issue(`${base}.id`, "invalid_edge", "Edge id is required"));
  }
  if (!edge.source || typeof edge.source !== "string") {
    issues.push(
      issue(`${base}.source`, "invalid_edge", "Edge source is required")
    );
  } else if (!nodeIds.has(edge.source)) {
    issues.push(
      issue(
        `${base}.source`,
        "invalid_edge",
        `Edge source "${edge.source}" is not a known node id`
      )
    );
  }
  if (!edge.target || typeof edge.target !== "string") {
    issues.push(
      issue(`${base}.target`, "invalid_edge", "Edge target is required")
    );
  } else if (!nodeIds.has(edge.target)) {
    issues.push(
      issue(
        `${base}.target`,
        "invalid_edge",
        `Edge target "${edge.target}" is not a known node id`
      )
    );
  }

  return issues;
}

/**
 * Validate a DesignGraph against COMPONENT_CATALOG.
 * Fails on unknown component types and invalid select/number/boolean attributes.
 */
export function validateDesignGraph(
  graph: DesignGraph | null | undefined
): DesignGraphValidationResult {
  const issues: DesignGraphIssue[] = [];

  if (!graph || typeof graph !== "object") {
    return {
      ok: false,
      issues: [issue("$", "invalid_graph", "DesignGraph is required")],
    };
  }

  if (!Array.isArray(graph.nodes)) {
    issues.push(issue("nodes", "invalid_graph", "nodes must be an array"));
  }
  if (!Array.isArray(graph.edges)) {
    issues.push(issue("edges", "invalid_graph", "edges must be an array"));
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const seenIds = new Set<string>();
  for (let i = 0; i < graph.nodes.length; i++) {
    issues.push(...validateNode(graph.nodes[i], i, seenIds));
  }

  for (let i = 0; i < graph.edges.length; i++) {
    issues.push(...validateEdge(graph.edges[i], i, seenIds));
  }

  return { ok: issues.length === 0, issues };
}

/** Throws AggregateError-style Error if validation fails. */
export function assertValidDesignGraph(graph: DesignGraph): void {
  const result = validateDesignGraph(graph);
  if (!result.ok) {
    const detail = result.issues
      .map((i) => `${i.path}: [${i.code}] ${i.message}`)
      .join("\n");
    throw new Error(`Invalid DesignGraph:\n${detail}`);
  }
}
