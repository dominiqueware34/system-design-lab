import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportCatalogSchema } from "@/lib/catalog-schema";
import { COMPONENT_CATALOG } from "@/lib/component-catalog";

describe("exportCatalogSchema", () => {
  it("exports all catalog types and attributes", () => {
    const schema = exportCatalogSchema();
    assert.equal(schema.version, 1);
    assert.equal(schema.componentCount, COMPONENT_CATALOG.length);
    assert.equal(schema.componentTypes.length, COMPONENT_CATALOG.length);
    assert.equal(schema.components.length, COMPONENT_CATALOG.length);

    for (const def of COMPONENT_CATALOG) {
      assert.ok(
        schema.componentTypes.includes(def.type),
        `missing type ${def.type}`
      );
      const entry = schema.components.find((c) => c.type === def.type);
      assert.ok(entry, `missing component ${def.type}`);
      assert.equal(entry!.attributes.length, def.attributes.length);
    }

    const sql = schema.components.find((c) => c.type === "sql_database");
    assert.ok(sql);
    const engine = sql!.attributes.find((a) => a.key === "engine");
    assert.ok(engine && engine.type === "select");
    if (engine && engine.type === "select") {
      assert.ok(engine.options.includes("PostgreSQL"));
    }
  });
});
