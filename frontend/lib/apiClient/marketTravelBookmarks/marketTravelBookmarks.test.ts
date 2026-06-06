/**
 * 自由市场星标 GET 契约：`order_ids` / `guide_ids` 若出现须为 string[]。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  deleteMarketTravelBookmark,
  getMarketTravelBookmarks,
  postMarketTravelBookmark,
  TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID,
} from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getMarketTravelBookmarks", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns payload when ids arrays valid", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_ids: ["a"], guide_ids: ["g"] }),
    );
    const out = await getMarketTravelBookmarks();
    expect(out).toEqual({ status: "ok", order_ids: ["a"], guide_ids: ["g"] });
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.meMarketBookmarks), expect.any(Object));
  });

  it("accepts omitted order_ids and guide_ids", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, { status: "ok" }));
    const out = await getMarketTravelBookmarks();
    expect(out.status).toBe("ok");
  });

  it("rejects order_ids null", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_ids: null }),
    );
    await expect(getMarketTravelBookmarks()).rejects.toThrow(TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID);
  });

  it("rejects guide_ids non-array", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", guide_ids: {} }),
    );
    await expect(getMarketTravelBookmarks()).rejects.toThrow(TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID);
  });

  it("rejects order_ids with non-string element", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", order_ids: [1] }),
    );
    await expect(getMarketTravelBookmarks()).rejects.toThrow(TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID);
  });

  it("rejects HTTP 401 unauthorized → login_required (get_me_market_bookmarks)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { status: "error", error: "unauthorized", message: "unauthorized" }, 401)
    );
    await expect(getMarketTravelBookmarks()).rejects.toThrow("login_required");
  });

  it("rejects HTTP 503 service_unavailable when no PG pool", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { status: "error", error: "service_unavailable", message: "service_unavailable" },
        503
      )
    );
    await expect(getMarketTravelBookmarks()).rejects.toThrow("service_unavailable");
  });
});

describe("postMarketTravelBookmark", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("rejects HTTP 503 service_unavailable when no PG pool", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(
        false,
        { status: "error", error: "service_unavailable", message: "service_unavailable" },
        503
      )
    );
    await expect(
      postMarketTravelBookmark("order", "550e8400-e29b-41d4-a716-446655440000")
    ).rejects.toThrow("service_unavailable");
  });
});

describe("deleteMarketTravelBookmark", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  const orderId = "550e8400-e29b-41d4-a716-446655440000";

  it("throws bookmark_not_found on HTTP 404 before parseResponse", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "{}",
    });
    await expect(deleteMarketTravelBookmark("order", orderId)).rejects.toThrow("bookmark_not_found");
  });

  it("DELETEs order target URL and completes on ok envelope", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await expect(deleteMarketTravelBookmark("order", orderId)).resolves.toBeUndefined();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meMarketBookmarkByTarget("order", orderId)),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
