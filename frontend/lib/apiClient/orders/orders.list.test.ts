/**
 * 54-S7：我的订单列表 `GET /api/v1/orders`（limit/cursor、分页 envelope）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { getOrders } from "./orderHttp";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getOrders (54-S7)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs orders with limit and cursor query params", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [{ id: "a" }] })
    );
    const out = await getOrders({ limit: 25, cursor: "cur-1" });
    expect(out.items).toEqual([{ id: "a" }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.orders)}?limit=25&cursor=cur-1`,
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("GETs orders with q and orders_chain_id query params", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [] })
    );
    await getOrders({ limit: 10, q: "Guilin", orders_chain_id: 137 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.orders)}?limit=10&orders_chain_id=137&q=Guilin`,
      expect.any(Object)
    );
  });

  it("GETs orders with state query param (B-071)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [] })
    );
    await getOrders({ limit: 10, state: "Completed" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.orders)}?limit=10&state=completed`,
      expect.any(Object)
    );
  });

  it("returns page when API includes page envelope", async () => {
    const page = { limit: 30, next_cursor: "n1", has_more: true };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [], page })
    );
    const out = await getOrders({ limit: 30 });
    expect(out.page).toEqual(page);
    expect(out.items).toEqual([]);
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "login_required" })
    );
    await expect(getOrders()).rejects.toThrow();
  });

  it("accepts no-chain_off stub: 200 ok + empty items + rule (routes/orders get_orders)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items: [],
        rule: "唯一数据源=后端 API；前端不得自行推进订单状态。完整实现需接入链上事件投影与 finalityN 门禁",
      })
    );
    const out = await getOrders();
    expect(out.items).toEqual([]);
    expect(out.page).toBeUndefined();
  });
});
