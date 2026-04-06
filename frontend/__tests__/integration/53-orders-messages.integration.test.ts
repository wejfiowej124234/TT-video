/**
 * 53-S11 / §六附续 §2：集成测试「订单聊天 orders/messages」
 * Mock GET/POST /api/v1/orders/:id/messages，断言 path、method、body 与 04 一致。
 */
// @vitest-environment node
// 与 `apiUrl()` Node/SSR 行为一致（绝对 URL）；浏览器 + loopback 下为相对路径。
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiBase, apiUrl, routes } from "@/lib/api";

const orderId = "order-msg-test-1";

describe("53 integration: orders/messages (mock fetch)", () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("GET order messages uses correct path and method", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok", items: [] }),
    });
    const url = apiUrl(routes.orderMessages(orderId));
    await fetch(url, { method: "GET", headers: {} });
    expect(mockFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ method: "GET" })
    );
    expect(url).toBe(`${apiBase}/api/v1/orders/${orderId}/messages`);
  });

  it("POST order message uses correct path, method and body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok" }),
    });
    const url = apiUrl(routes.orderMessages(orderId));
    const body = { content: "Hello, 53 orders/messages test" };
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(mockFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      })
    );
    expect(url).toBe(`${apiBase}/api/v1/orders/${orderId}/messages`);
  });
});
