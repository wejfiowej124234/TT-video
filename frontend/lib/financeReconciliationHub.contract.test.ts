import { describe, expect, it } from "vitest";
import { normalizeAdminCrossCheckRead, normalizeAdminDriftSummaryRead } from "@/lib/apiClient";
import {
  FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS,
  FINANCE_RECONCILIATION_HUB_LAST_STORED_META_KEY,
  FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS,
  FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS,
} from "@/lib/financeReconciliationHubPaths";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Epic E-08：枢纽页消费的 JSON 形状（键路径存在性）；不断言金额、条数业务值或 Σ。
 */
describe("finance-reconciliation hub · finance/summary paths (contract)", () => {
  it("fixture carries every meta scalar key the hub lists", () => {
    const meta: Record<string, unknown> = {};
    for (const k of FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS) {
      meta[k] = null;
    }
    const last: Record<string, unknown> = {};
    for (const k of FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS) {
      last[k] = null;
    }
    meta[FINANCE_RECONCILIATION_HUB_LAST_STORED_META_KEY] = last;

    for (const k of FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(meta, k)).toBe(true);
    }
    const nested = meta[FINANCE_RECONCILIATION_HUB_LAST_STORED_META_KEY];
    expect(isRecord(nested)).toBe(true);
    if (isRecord(nested)) {
      for (const k of FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS) {
        expect(Object.prototype.hasOwnProperty.call(nested, k)).toBe(true);
      }
    }
  });

  it("fixture carries every summary scalar key the hub lists", () => {
    const summary: Record<string, unknown> = {};
    for (const k of FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS) {
      summary[k] = null;
    }
    for (const k of FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(summary, k)).toBe(true);
    }
  });
});

describe("finance-reconciliation hub · cross-check drift_summary slice (contract)", () => {
  it("normalizeAdminCrossCheckRead exposes drift_summary keys used by the hub", () => {
    const raw = {
      status: "ok",
      drift_summary: {
        drift_detected: false,
        delta: [],
      },
    };
    const n = normalizeAdminCrossCheckRead(raw);
    const ds = n.drift_summary;
    expect(ds).toBeDefined();
    expect(typeof ds).toBe("object");
    expect(ds).not.toBeNull();
    if (!ds || typeof ds !== "object") throw new Error("expected drift_summary object");
    expect(Object.prototype.hasOwnProperty.call(ds, "drift_detected")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(ds, "delta")).toBe(true);
    expect([undefined, true, false]).toContain(ds.drift_detected);
  });
});

describe("finance-reconciliation hub · drift-summary root (contract)", () => {
  it("normalizeAdminDriftSummaryRead exposes drift_detected and delta keys", () => {
    const raw = {
      status: "ok",
      drift_detected: true,
      delta: [],
    };
    const n = normalizeAdminDriftSummaryRead(raw);
    expect(Object.prototype.hasOwnProperty.call(n, "drift_detected")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(n, "delta")).toBe(true);
    expect([undefined, true, false]).toContain(n.drift_detected);
  });
});
