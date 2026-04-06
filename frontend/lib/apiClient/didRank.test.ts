/**
 * DID 排行榜 GET（period=week|month|all）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { getDidRankTravelers, getDidRankGuides, getDidRankItineraries } from "./didRank";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getDidRankTravelers", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs with period=week", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        period: "week",
        since: "2026-03-21T00:00:00Z",
        limit: 30,
        rank_basis: "tourist_completed_orders_in_window",
        travelers: [],
      })
    );
    const out = await getDidRankTravelers("week");
    expect(out).toMatchObject({
      status: "ok",
      rank_basis: "tourist_completed_orders_in_window",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.didRankTravelers)}?period=week`,
      expect.any(Object)
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_period" })
    );
    await expect(getDidRankTravelers("month")).rejects.toThrow();
  });
});

describe("getDidRankGuides", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs with period=all", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [] })
    );
    await getDidRankGuides("all");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.didRankGuides)}?period=all&sort=weighted`,
      expect.any(Object)
    );
  });

  it("parses guide rank_basis for 30 §3 / smoke alignment", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        period: "week",
        since: "2026-03-21T00:00:00Z",
        limit: 30,
        rank_basis: "guide_reception_gross_total_then_completed_count",
        guides: [],
      })
    );
    const out = await getDidRankGuides("week");
    expect(out).toMatchObject({
      status: "ok",
      rank_basis: "guide_reception_gross_total_then_completed_count",
    });
  });

  it("GETs with sort=reviews for review-first rank_basis (04 附录 / check-55)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        period: "week",
        since: "2026-03-21T00:00:00Z",
        limit: 30,
        rank_basis:
          "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3",
        guides: [],
      })
    );
    const out = await getDidRankGuides("week", "reviews");
    expect(out).toMatchObject({
      status: "ok",
      rank_basis:
        "guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.didRankGuides)}?period=week&sort=reviews`,
      expect.any(Object)
    );
  });

  it("GETs with sort=weighted for weighted rank_basis (04 附录 / check-55)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        period: "week",
        since: "2026-03-21T00:00:00Z",
        limit: 30,
        rank_basis:
          "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3",
        guides: [],
      })
    );
    const out = await getDidRankGuides("week", "weighted");
    expect(out).toMatchObject({
      status: "ok",
      rank_basis:
        "guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.didRankGuides)}?period=week&sort=weighted`,
      expect.any(Object)
    );
  });
});

describe("getDidRankItineraries", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs with period=month", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items: [] })
    );
    await getDidRankItineraries("month");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${apiUrl(routes.didRankItineraries)}?period=month`,
      expect.any(Object)
    );
  });

  it("parses itineraries rank_basis for smoke / check-55 alignment", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        period: "week",
        since: "2026-03-21T00:00:00Z",
        limit: 30,
        rank_basis: "order_completed_at",
        itineraries: [],
      })
    );
    const out = await getDidRankItineraries("week");
    expect(out).toMatchObject({
      status: "ok",
      rank_basis: "order_completed_at",
    });
  });
});
