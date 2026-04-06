/**
 * 订单创建与详情：`POST /api/v1/orders`、`GET /api/v1/orders/:id`（04；与 Escrow 前置一致）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { getOrder, getOrderChainSyncStatus, postOrder } from "./orders";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getOrder", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs order by id with auth-style headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order: { id: "ord-1" } })
    );
    const out = await getOrder("ord-1");
    expect(out).toEqual({ status: "ok", order: { id: "ord-1" } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderById("ord-1")),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "not_found" })
    );
    await expect(getOrder("missing")).rejects.toThrow();
  });
});

describe("getOrderChainSyncStatus", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs chain-sync-status with auth-style headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        order_id: "ord-1",
        chain_sync: { status: "pending", finality_n: 12, checkpoint: { block_number: 1, log_index: 0 } },
      })
    );
    const out = await getOrderChainSyncStatus("ord-1");
    expect(out).toMatchObject({ status: "ok", chain_sync: expect.any(Object) });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderChainSyncStatus("ord-1")),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "forbidden" })
    );
    await expect(getOrderChainSyncStatus("x")).rejects.toThrow();
  });
});

describe("postOrder", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs JSON with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_id: "new-1" })
    );
    const body = {
      guide_id: "g1",
      amount: "100",
      currency: "USDC",
      escrow_address: "0x0000000000000000000000000000000000000001" as string | null,
    };
    const out = await postOrder(body, "idem-po");
    expect(out).toEqual({ status: "ok", order_id: "new-1" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orders),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-po" }),
        body: JSON.stringify({
          guide_id: "g1",
          amount: "100",
          currency: "USDC",
          escrow_address: "0x0000000000000000000000000000000000000001",
        }),
      })
    );
  });

  it("omits null escrow_address from JSON body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postOrder({ guide_id: "g2", amount: "50", escrow_address: null });
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(call[1].body as string)).toEqual({
      guide_id: "g2",
      amount: "50",
    });
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_guide" })
    );
    await expect(postOrder({ guide_id: "x", amount: "1" }, "k")).rejects.toThrow();
  });
});
