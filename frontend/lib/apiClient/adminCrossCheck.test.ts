import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getAdminCrossCheck,
  getAdminDriftSummary,
  readAdminJsonStatus,
  normalizeAdminCrossCheckRead,
  normalizeAdminDriftSummaryRead,
  normalizeCrossCheckSlot,
} from "./adminCrossCheck";

function okJsonResponse(body: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("admin cross-check / drift-summary (C-01)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getAdminCrossCheck calls cross-check URL and returns wide envelope", async () => {
    const payload = {
      status: "ok",
      fee_pool_projection: { source_kind: "projection", body: { x: 1 } },
      governance_pool_chain: { source_kind: "chain_ssot", body: { y: 2 } },
      protocol_reference: { source_kind: "reference", body: { z: 3 } },
      drift_summary: { drift_detected: false, delta: [] },
    };
    vi.stubGlobal("fetch", vi.fn(async () => okJsonResponse(payload)));
    await expect(getAdminCrossCheck()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.admin.crossCheck),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": expect.any(String),
        }) as Record<string, unknown>,
      }),
    );
  });

  it("getAdminCrossCheck throws on API error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJsonResponse({
          status: "error",
          error: "cross_check_upstream_failed",
          message: "cross_check_upstream_failed",
        }),
      ),
    );
    await expect(getAdminCrossCheck()).rejects.toThrow("cross_check_upstream_failed");
  });

  it("getAdminDriftSummary calls drift-summary URL and returns wide body", async () => {
    const payload = { status: "ok", drift_detected: false, delta: [] };
    vi.stubGlobal("fetch", vi.fn(async () => okJsonResponse(payload)));
    await expect(getAdminDriftSummary()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      apiUrl(routes.admin.driftSummary),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": expect.any(String),
        }) as Record<string, unknown>,
      }),
    );
  });
});

describe("admin cross-check read helpers (C-02)", () => {
  it("normalizeAdminCrossCheckRead extracts status, slots, drift_summary without typing body", () => {
    const raw = {
      status: "ok",
      fee_pool_projection: { source_kind: "projection", body: { deep: { a: 1 } } },
      governance_pool_chain: { source_kind: "chain_ssot", body: null },
      protocol_reference: { source_kind: "reference", body: "x" },
      drift_summary: { drift_detected: true, delta: [{ field: "k" }] },
    };
    expect(normalizeAdminCrossCheckRead(raw)).toEqual({
      status: "ok",
      fee_pool_projection: { source_kind: "projection", body: { deep: { a: 1 } } },
      governance_pool_chain: { source_kind: "chain_ssot", body: null },
      protocol_reference: { source_kind: "reference", body: "x" },
      drift_summary: { drift_detected: true, delta: [{ field: "k" }] },
    });
  });

  it("normalizeCrossCheckSlot drops unknown source_kind but keeps body", () => {
    expect(
      normalizeCrossCheckSlot({ source_kind: "other", body: { n: 1 } }),
    ).toEqual({ source_kind: undefined, body: { n: 1 } });
  });

  it("normalizeAdminDriftSummaryRead coerces only boolean drift_detected", () => {
    expect(
      normalizeAdminDriftSummaryRead({
        status: "ok",
        drift_detected: "true",
        delta: [1],
      }),
    ).toEqual({ status: "ok", drift_detected: undefined, delta: [1] });
  });

  it("readAdminJsonStatus and normalize handle non-objects", () => {
    expect(readAdminJsonStatus(null)).toBeUndefined();
    expect(normalizeAdminCrossCheckRead(undefined).status).toBeUndefined();
    expect(normalizeAdminDriftSummaryRead(42).delta).toBeUndefined();
  });

  it("nested drift_summary: drift_detected false is distinct from missing key (undefined)", () => {
    const absent = normalizeAdminCrossCheckRead({
      status: "ok",
      drift_summary: { delta: [] },
    });
    expect(absent.drift_summary?.drift_detected).toBeUndefined();

    const explicitFalse = normalizeAdminCrossCheckRead({
      status: "ok",
      drift_summary: { drift_detected: false, delta: [] },
    });
    expect(explicitFalse.drift_summary?.drift_detected).toBe(false);
  });

  it("drift-summary root: drift_detected false vs omitted (undefined)", () => {
    expect(normalizeAdminDriftSummaryRead({ status: "ok", delta: [] }).drift_detected).toBeUndefined();
    expect(
      normalizeAdminDriftSummaryRead({ status: "ok", drift_detected: false, delta: [] }).drift_detected,
    ).toBe(false);
  });
});
