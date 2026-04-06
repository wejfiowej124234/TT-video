/**
 * 53 行程 PATCH、评价 GET/POST（04 §3.4；与 Escrow 行程编辑、ReviewBlock 一致）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { patchOrderItinerary, getOrderReviews, postReview } from "./orders";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("patchOrderItinerary (53)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("PATCHes itinerary route with JSON body and idempotency headers", async () => {
    const body = { daily_itinerary: [{ day_index: 1, content_text: "x" }], expected_version: 2 };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", version: 3 })
    );
    const out = await patchOrderItinerary("ord-p", body, "idem-patch-1");
    expect(out).toMatchObject({ status: "ok", version: 3 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderPatchItinerary("ord-p")),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-patch-1",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "version_conflict" })
    );
    await expect(patchOrderItinerary("o", {}, "k")).rejects.toThrow();
  });
});

describe("getOrderReviews", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs reviews route and returns items", async () => {
    const items = [{ id: "r1", reviewer_id: "a", reviewee_id: "b", score: 5, weight: 0.25 }];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, {
        status: "ok",
        items,
        meta: { review_weight_rule_version: "review_weight_v1", review_weight_rule: "x" },
      })
    );
    expect(await getOrderReviews("ord-r")).toEqual({
      items: [{ id: "r1", reviewer_id: "a", reviewee_id: "b", score: 5, weight: 0.25 }],
      meta: { review_weight_rule_version: "review_weight_v1", review_weight_rule: "x" },
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderReviews("ord-r")),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("returns empty items when items missing", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    expect(await getOrderReviews("x")).toEqual({ items: [] });
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "login_required" })
    );
    await expect(getOrderReviews("x")).rejects.toThrow();
  });
});

describe("postReview", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs score and optional comment with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", id: "rev-1" })
    );
    const out = await postReview("ord-rv", { score: 4, comment: "  ok  " }, "idem-rev");
    expect(out).toMatchObject({ status: "ok", id: "rev-1" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderReviews("ord-rv")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ score: 4, comment: "  ok  " }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-rev",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "already_reviewed" })
    );
    await expect(postReview("o", { score: 5 }, "k")).rejects.toThrow();
  });
});
