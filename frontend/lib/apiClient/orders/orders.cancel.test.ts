/**
 * 54-S5/S8：删除订单入口调用 `POST /api/v1/orders/:id/cancel`（与 04、订单列表/详情一致）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { orderCancel } from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("orderCancel (54-S5/S8)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs to orderCancel route with Idempotency-Key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await orderCancel("order-uuid-1", "idem-cancel-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderCancel("order-uuid-1")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "idem-cancel-1",
          "X-Idempotency-Key": "idem-cancel-1",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_state" })
    );
    await expect(orderCancel("x", "k")).rejects.toThrow();
  });

  it("rejects HTTP 503 chain_off_unavailable (order_cancel)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(orderCancel("550e8400-e29b-41d4-a716-446655440000", "k")).rejects.toThrow(
      "chain_off_unavailable"
    );
  });
});
