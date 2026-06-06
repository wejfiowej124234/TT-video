import { describe, it, expect, vi, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  getAdminCrossCheck,
  getAdminDriftSummary,
  readAdminJsonStatus,
  normalizeAdminCrossCheckRead,
  normalizeAdminDriftSummaryRead,
  normalizeCrossCheckSlot,
} from ".";

function okJsonResponse(body: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  } as Response;
}

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
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

  it("getAdminCrossCheck rejects HTTP 503 chain_off_unavailable (require_admin_actor)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
      ),
    );
    await expect(getAdminCrossCheck()).rejects.toThrow("chain_off_unavailable");
  });

  it("getAdminCrossCheck rejects HTTP 502 cross_check_upstream_failed (build_admin_cross_check_value)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(
          false,
          {
            status: "error",
            error: "cross_check_upstream_failed",
            message: "cross_check_upstream_failed",
            detail: "x",
          },
          502
        )
      ),
    );
    await expect(getAdminCrossCheck()).rejects.toThrow("cross_check_upstream_failed");
  });

  it("getAdminCrossCheck rejects HTTP 401 login_required (require_admin_actor)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "login_required", message: "login_required" }, 401)
      ),
    );
    await expect(getAdminCrossCheck()).rejects.toThrow("login_required");
  });

  it("getAdminCrossCheck rejects HTTP 403 admin_required (require_admin_actor)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "admin_required", message: "admin_required" }, 403)
      ),
    );
    await expect(getAdminCrossCheck()).rejects.toThrow("admin_required");
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

  it("getAdminDriftSummary rejects HTTP 503 chain_off_unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
      ),
    );
    await expect(getAdminDriftSummary()).rejects.toThrow("chain_off_unavailable");
  });

  it("getAdminDriftSummary rejects HTTP 401 login_required (require_admin_actor)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "login_required", message: "login_required" }, 401)
      ),
    );
    await expect(getAdminDriftSummary()).rejects.toThrow("login_required");
  });

  it("getAdminDriftSummary rejects HTTP 403 admin_required (require_admin_actor)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        mockTextResponse(false, { error: "admin_required", message: "admin_required" }, 403)
      ),
    );
    await expect(getAdminDriftSummary()).rejects.toThrow("admin_required");
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
