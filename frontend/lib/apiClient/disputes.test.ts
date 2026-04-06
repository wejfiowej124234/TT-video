/**
 * 争议 API：列表、详情、证据、裁决、执行裁决意向（04 / 48 intents）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getDisputes,
  getDispute,
  getOrderEvidence,
  postOrderEvidence,
  postDisputeResolve,
  postDisputeExecuteResolutionIntent,
} from "./disputes";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getDisputes", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns items array", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [{ id: "d1" }] })
    );
    const out = await getDisputes();
    expect(out).toEqual([{ id: "d1" }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.disputes),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "login_required" })
    );
    await expect(getDisputes()).rejects.toThrow();
  });
});

describe("getDispute", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns dispute payload", async () => {
    const dispute = { id: "disp-1", state: "open" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", dispute })
    );
    expect(await getDispute("disp-1")).toEqual(dispute);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.disputeById("disp-1")),
      expect.any(Object)
    );
  });

  it("throws dispute_not_found when ok but missing dispute", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await expect(getDispute("x")).rejects.toThrow("dispute_not_found");
  });

  it("rejects on envelope error before dispute check", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "forbidden" })
    );
    await expect(getDispute("x")).rejects.toThrow();
  });
});

describe("getOrderEvidence", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs evidence list for order", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [] })
    );
    expect(await getOrderEvidence("ord-e")).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderEvidence("ord-e")),
      expect.any(Object)
    );
  });
});

describe("postOrderEvidence", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs content_hash with idempotency", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postOrderEvidence("ord-ev", { content_hash: "0xabc" }, "idem-ev");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderEvidence("ord-ev")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-ev" }),
        body: JSON.stringify({ content_hash: "0xabc" }),
      })
    );
  });
});

describe("postDisputeResolve", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs resolve body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postDisputeResolve("disp-r", { refund_ratio: 0.5, slash_guide: false }, "idem-r");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.disputeResolve("disp-r")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refund_ratio: 0.5, slash_guide: false }),
      })
    );
  });
});

describe("postDisputeExecuteResolutionIntent", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs body and idempotency; returns data on ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", typedData: {} })
    );
    const out = await postDisputeExecuteResolutionIntent("disp-i", { x: 1 }, "idem-i");
    expect(out).toEqual({ status: "ok", typedData: {} });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.disputeExecuteResolutionIntent("disp-i")),
      expect.objectContaining({
        body: JSON.stringify({ x: 1 }),
        headers: expect.objectContaining({ "Idempotency-Key": "idem-i" }),
      })
    );
  });

  it("POSTs {} when body omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postDisputeExecuteResolutionIntent("disp-i2");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.disputeExecuteResolutionIntent("disp-i2")),
      expect.objectContaining({ body: "{}" })
    );
  });

  it("returns envelope error without throwing", async () => {
    const errBody = { status: "error", error: "invalid_state" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, errBody));
    expect(await postDisputeExecuteResolutionIntent("d", {}, "k")).toEqual(errBody);
  });
});
