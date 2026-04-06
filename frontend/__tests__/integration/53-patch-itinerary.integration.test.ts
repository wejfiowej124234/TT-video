/**
 * 53-S11 / §六附续 §2：集成测试「订单行程写回 PATCH itinerary」
 * Mock PATCH /api/v1/orders/:id/itinerary，断言 path、method、body、Idempotency-Key 与 04 一致。
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiBase, apiUrl, routes } from "@/lib/api";
import { patchOrderItinerary } from "@/lib/apiClient/orders";
import { getIdempotencyKey } from "@/lib/apiClient";

const orderId = "patch-itinerary-test-1";

describe("53 integration: PATCH order itinerary (mock fetch)", () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("PATCH itinerary uses correct path and method", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ status: "ok" }),
    });
    const body = { daily_itinerary: [{ day_index: 1, content_text: "Day 1 test" }] };
    await patchOrderItinerary(orderId, body, "idem-key-1");
    const url = apiUrl(routes.orderPatchItinerary(orderId));
    expect(mockFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(body),
      })
    );
    expect(url).toBe(`${apiBase}/api/v1/orders/${orderId}/itinerary`);
  });

  it("PATCH itinerary sends Idempotency-Key when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ status: "ok" }),
    });
    const body = { amount_breakdown: { hotel: 100, total_budget: 100 } };
    const key = getIdempotencyKey();
    await patchOrderItinerary(orderId, body, key);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Idempotency-Key": key,
        }),
      })
    );
  });
});
