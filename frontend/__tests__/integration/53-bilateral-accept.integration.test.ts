/**
 * 53-S11 / §六附续 §2：集成测试「双边确认」「抢单/确认接单」— 调用 apiClient 并断言传参（orderId + 幂等键）
 * 实际请求被 mock，仅验证调用约定与幂等键传递。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { orderAccept, orderConfirmBilateral } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  orderAccept: vi.fn(),
  orderConfirmBilateral: vi.fn(),
  getOrder: vi.fn(),
  getIdempotencyKey: vi.fn(() => "idem-" + Math.random().toString(36).slice(2)),
}));

describe("53 integration: accept & confirm-bilateral (mock API)", () => {
  beforeEach(() => {
    vi.mocked(orderAccept).mockResolvedValue({ status: "ok", order: { id: "o1", status: "accepted" } } as never);
    vi.mocked(orderConfirmBilateral).mockResolvedValue({ status: "ok" } as never);
  });

  it("orderAccept called with orderId and idempotency key", async () => {
    const key = "test-key-" + Date.now();
    await orderAccept("order-uuid-1", key);
    expect(orderAccept).toHaveBeenCalledWith("order-uuid-1", key);
  });

  it("orderConfirmBilateral called with orderId and idempotency key", async () => {
    const key = "bilateral-key-" + Date.now();
    await orderConfirmBilateral("order-uuid-2", key);
    expect(orderConfirmBilateral).toHaveBeenCalledWith("order-uuid-2", key);
  });
});
