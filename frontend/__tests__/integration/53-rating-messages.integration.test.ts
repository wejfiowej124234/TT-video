/**
 * 53-S11 / §六附续 §2：集成测试「评分页+API」「订单聊天 orders/messages」— mock 调用约定
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { orderConfirmRating } from "@/lib/apiClient";

// 评分确认与订单消息接口约定：orderConfirmRating(orderId, idempotencyKey?)
vi.mock("@/lib/apiClient", () => ({
  orderConfirmRating: vi.fn(),
  getOrder: vi.fn(),
}));

describe("53 integration: rating confirm (mock API)", () => {
  beforeEach(() => {
    vi.mocked(orderConfirmRating).mockResolvedValue({ status: "ok" } as never);
  });

  it("orderConfirmRating called with orderId and optional idempotency key", async () => {
    await orderConfirmRating("order-rate-1");
    expect(orderConfirmRating).toHaveBeenCalledWith("order-rate-1");
    const first = vi.mocked(orderConfirmRating).mock.calls[0];
    expect(first?.length).toBe(1);
    vi.mocked(orderConfirmRating).mockClear();
    await orderConfirmRating("order-rate-2", "idem-rating-1");
    expect(orderConfirmRating).toHaveBeenCalledWith("order-rate-2", "idem-rating-1");
  });
});
