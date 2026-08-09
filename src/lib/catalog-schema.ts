/**
 * Offline catalog export for campaign prompt generation (Artifact 3).
 * Pure data derived from COMPONENT_CATALOG — no Plan B / QPS engine.
 */

import {
  COMPONENT_CATALOG,
  getComponentByType,
} from "@/lib/component-catalog";
import type { AttributeField, ComponentDefinition } from "@/lib/types";

export type CatalogAttributeSchema =
  | {
      key: string;
      label: string;
      type: "select";
      options: string[];
      defaultValue: string;
    }
  | {
      key: string;
      label: string;
      type: "number";
      min?: number;
      max?: number;
      unit?: string;
      defaultValue: number;
    }
  | {
      key: string;
      label: string;
      type: "boolean";
      defaultValue: boolean;
    }
  | {
      key: string;
      label: string;
      type: "text";
      defaultValue: string;
    };

export interface CatalogComponentSchema {
  type: string;
  label: string;
  category: string;
  description: string;
  attributes: CatalogAttributeSchema[];
}

export interface CatalogSchemaExport {
  /** Schema format version (not season pack version). */
  version: 1;
  componentCount: number;
  componentTypes: string[];
  components: CatalogComponentSchema[];
}

function mapAttribute(attr: AttributeField): CatalogAttributeSchema {
  switch (attr.type) {
    case "select":
      return {
        key: attr.key,
        label: attr.label,
        type: "select",
        options: [...attr.options],
        defaultValue: attr.defaultValue,
      };
    case "number":
      return {
        key: attr.key,
        label: attr.label,
        type: "number",
        min: attr.min,
        max: attr.max,
        unit: attr.unit,
        defaultValue: attr.defaultValue,
      };
    case "boolean":
      return {
        key: attr.key,
        label: attr.label,
        type: "boolean",
        defaultValue: attr.defaultValue,
      };
    case "text":
      return {
        key: attr.key,
        label: attr.label,
        type: "text",
        defaultValue: attr.defaultValue,
      };
  }
}

function mapComponent(def: ComponentDefinition): CatalogComponentSchema {
  return {
    type: def.type,
    label: def.label,
    category: def.category,
    description: def.description,
    attributes: def.attributes.map(mapAttribute),
  };
}

/**
 * Export component types + attribute enums/ranges as JSON-friendly schema
 * for AI generateObject prompts and offline validation.
 */
export function exportCatalogSchema(): CatalogSchemaExport {
  const components = COMPONENT_CATALOG.map(mapComponent);
  return {
    version: 1,
    componentCount: components.length,
    componentTypes: components.map((c) => c.type),
    components,
  };
}

/** Convenience: known type set for validators. */
export function catalogTypeSet(): Set<string> {
  return new Set(COMPONENT_CATALOG.map((c) => c.type));
}

/** Attribute field definition for a component type, or undefined if type unknown. */
export function getCatalogAttribute(
  componentType: string,
  attributeKey: string
): AttributeField | undefined {
  const def = getComponentByType(componentType);
  return def?.attributes.find((a) => a.key === attributeKey);
}
