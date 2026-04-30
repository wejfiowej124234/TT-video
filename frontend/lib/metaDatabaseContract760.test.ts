import { describe, it, expect } from "vitest";
import { assertMetaDatabaseContract760, DATABASE_META_TOP_KEYS } from "./metaDatabaseContract760";

function buildDatabase(connected: boolean): Record<string, unknown> {
  return {
    connected,
    status: connected ? "ok" : "degraded",
    reason: connected ? null : "database_not_connected",
    rule: "760 test",
    database_top_keys: [...DATABASE_META_TOP_KEYS],
    database_top_keys_contract_760: "**760** contract",
  };
}

function metaRoot(connected: boolean): Record<string, unknown> {
  return {
    service: "traveltrust-api",
    database_connected: connected,
    database: buildDatabase(connected),
  };
}

describe("assertMetaDatabaseContract760", () => {
  it("accepts connected ok snapshot", () => {
    expect(() => assertMetaDatabaseContract760(metaRoot(true))).not.toThrow();
  });

  it("accepts degraded when not connected", () => {
    expect(() => assertMetaDatabaseContract760(metaRoot(false))).not.toThrow();
  });

  it("rejects wrong key order on database object", () => {
    const db = buildDatabase(true);
    const bad = {
      ...metaRoot(true),
      database: {
        status: db.status,
        connected: db.connected,
        reason: db.reason,
        rule: db.rule,
        database_top_keys: db.database_top_keys,
        database_top_keys_contract_760: db.database_top_keys_contract_760,
      },
    };
    expect(() => assertMetaDatabaseContract760(bad)).toThrow(/key order/);
  });

  it("rejects database_connected mismatch", () => {
    const bad = {
      ...metaRoot(true),
      database: { ...buildDatabase(true), connected: false },
    };
    expect(() => assertMetaDatabaseContract760(bad)).toThrow(/database_connected/);
  });
});
