/**
 * Order intent endpoints (48 routes): confirm-completion-intent, open-dispute-intent.
 * These log envelope errors but do not throw — callers handle `status !== "ok"`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { postOrderConfirmCompletionIntent, postOrderOpenDisputeIntent } from "./orders";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("postOrderConfirmCompletionIntent", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs JSON body and idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", typedData: {} })
    );
    const out = await postOrderConfirmCompletionIntent(
      "ord-cci",
      { domain: { name: "x" } },
      "idem-cci"
    );
    expect(out).toEqual({ status: "ok", typedData: {} });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderConfirmCompletionIntent("ord-cci")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-cci" }),
        body: JSON.stringify({ domain: { name: "x" } }),
      })
    );
  });

  it("POSTs {} when body omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postOrderConfirmCompletionIntent("ord-cci2");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderConfirmCompletionIntent("ord-cci2")),
      expect.objectContaining({ body: "{}" })
    );
  });

  it("returns envelope error without throwing", async () => {
    const errBody = { status: "error", error: "invalid_state" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, errBody));
    const out = await postOrderConfirmCompletionIntent("o", {}, "k");
    expect(out).toEqual(errBody);
  });
});

describe("postOrderOpenDisputeIntent", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs JSON body and idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", typedData: {} })
    );
    const out = await postOrderOpenDisputeIntent(
      "ord-odi",
      { reasonHash: "0xabc" },
      "idem-odi"
    );
    expect(out).toEqual({ status: "ok", typedData: {} });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderOpenDisputeIntent("ord-odi")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-odi" }),
        body: JSON.stringify({ reasonHash: "0xabc" }),
      })
    );
  });

  it("POSTs {} when body omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postOrderOpenDisputeIntent("ord-odi2");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderOpenDisputeIntent("ord-odi2")),
      expect.objectContaining({ body: "{}" })
    );
  });

  it("returns envelope error without throwing", async () => {
    const errBody = { status: "error", error: "not_eligible" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, errBody));
    const out = await postOrderOpenDisputeIntent("o", {}, "k");
    expect(out).toEqual(errBody);
  });
});
