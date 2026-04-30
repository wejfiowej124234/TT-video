/**
 * 自由市场星标 GET 契约：`order_ids` / `guide_ids` 若出现须为 string[]。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getMarketTravelBookmarks,
  TRAVELTRUST_MARKET_TRAVEL_BOOKMARKS_CONTRACT_INVALID,
} from "./marketTravelBookmarks";

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
});
