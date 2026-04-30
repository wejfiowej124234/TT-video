/**
 * **760**：`GET /meta` → **`database`** 对象 HTTP 机读键集（与 `crates/api/.../meta_contract_keys.rs` **`DATABASE_META_TOP_KEYS`** 同源）。
 * 供 Playwright 严格门禁与 Vitest 回归；E2E 经 `e2e/helpers/metaChainGuard` 调用。
 */

export const DATABASE_META_TOP_KEYS = [
  "connected",
  "status",
  "reason",
  "rule",
  "database_top_keys",
  "database_top_keys_contract_760",
] as const;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function keyOrderMatches(obj: Record<string, unknown>, ordered: readonly string[]): boolean {
  const keys = Object.keys(obj);
  return keys.length === ordered.length && keys.every((k, i) => k === ordered[i]);
}

/** 严格校验 **`meta.database`** 与根级 **`database_connected`** 一致（与 API 实现同源）。 */
export function assertMetaDatabaseContract760(meta: Record<string, unknown>): void {
  const db = meta.database;
  if (!isRecord(db)) {
    throw new Error("GET /meta: database object missing or invalid");
  }
  if (!keyOrderMatches(db, DATABASE_META_TOP_KEYS)) {
    throw new Error(
      `GET /meta.database: top-level key order must match 760 contract; got ${JSON.stringify(Object.keys(db))}`,
    );
  }

  const connected = db.connected;
  if (typeof connected !== "boolean") {
    throw new Error(`GET /meta.database.connected: expected boolean, got ${JSON.stringify(connected)}`);
  }

  const status = db.status;
  if (status !== "ok" && status !== "degraded") {
    throw new Error(`GET /meta.database.status: expected ok|degraded, got ${JSON.stringify(status)}`);
  }

  const reason = db.reason;
  if (reason !== null && typeof reason !== "string") {
    throw new Error(`GET /meta.database.reason: expected string|null, got ${JSON.stringify(reason)}`);
  }

  const topKeys = db.database_top_keys;
  if (!Array.isArray(topKeys) || topKeys.length !== DATABASE_META_TOP_KEYS.length) {
    throw new Error("GET /meta.database.database_top_keys: expected array of 6 strings");
  }
  for (let i = 0; i < DATABASE_META_TOP_KEYS.length; i++) {
    if (topKeys[i] !== DATABASE_META_TOP_KEYS[i]) {
      throw new Error(
        `GET /meta.database.database_top_keys[${i}]: expected ${DATABASE_META_TOP_KEYS[i]}, got ${JSON.stringify(topKeys[i])}`,
      );
    }
  }

  const contract760 = db.database_top_keys_contract_760;
  if (typeof contract760 !== "string" || !contract760.includes("760")) {
    throw new Error(
      "GET /meta.database.database_top_keys_contract_760: expected non-empty string mentioning 760",
    );
  }

  const rootConnected = meta.database_connected;
  if (typeof rootConnected !== "boolean" || rootConnected !== connected) {
    throw new Error(
      `GET /meta: database_connected (${JSON.stringify(rootConnected)}) must equal database.connected (${connected})`,
    );
  }

  if (connected) {
    if (status !== "ok") {
      throw new Error("GET /meta.database: when connected=true, status must be ok");
    }
    if (reason !== null) {
      throw new Error("GET /meta.database: when connected=true, reason must be null");
    }
  } else {
    if (status !== "degraded") {
      throw new Error("GET /meta.database: when connected=false, status must be degraded");
    }
    if (reason !== "database_not_connected") {
      throw new Error(
        `GET /meta.database: when connected=false, reason must be database_not_connected, got ${JSON.stringify(reason)}`,
      );
    }
  }
}
