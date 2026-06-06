/**
 * 54-S9：自由市场 `GET /api/v1/discover/orders`（`/market` 列表数据源；筛选与分页）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { getDiscoverOrders } from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getDiscoverOrders (54-S9)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs discover orders with country, city, limit, cursor", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [{ id: "o1" }] })
    );
    const out = await getDiscoverOrders({
      country: "中国",
      city: "北京",
      limit: 30,
      cursor: "c2",
    });
    expect(out.items).toEqual([{ id: "o1" }]);
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl.startsWith(apiUrl(routes.discoverOrders))).toBe(true);
    expect(calledUrl).toContain("country=");
    expect(calledUrl).toContain("city=");
    expect(calledUrl).toContain("limit=30");
    expect(calledUrl).toContain("cursor=c2");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      calledUrl,
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("returns page when present", async () => {
    const page = { limit: 30, next_cursor: null, has_more: false };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [], page })
    );
    const out = await getDiscoverOrders({ limit: 30 });
    expect(out.page).toEqual(page);
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "bad" })
    );
    await expect(getDiscoverOrders()).rejects.toThrow();
  });

  it("accepts no-chain_off stub: 200 ok + empty items (get_discover_orders)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [] })
    );
    const out = await getDiscoverOrders();
    expect(out.items).toEqual([]);
    expect(out.page).toBeUndefined();
  });
});
