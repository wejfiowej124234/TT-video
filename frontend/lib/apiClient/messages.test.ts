/**
 * 53-S7 / 54 清单：订单聊天 `GET`/`POST /api/v1/orders/:id/messages`（04 §3.4；与 ChatBlock 一致）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { getOrderMessages, postOrderMessage } from "./messages";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getOrderMessages", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs order messages route and returns items array", async () => {
    const items = [
      {
        id: "m1",
        sender_id: "u1",
        content: "hi",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", items })
    );
    const out = await getOrderMessages("ord-42");
    expect(out).toEqual(items);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderMessages("ord-42")),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("returns empty array when items missing", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    expect(await getOrderMessages("x")).toEqual([]);
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "order_not_found" })
    );
    await expect(getOrderMessages("x")).rejects.toThrow();
  });
});

describe("postOrderMessage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs JSON body with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", id: "msg-new" })
    );
    const data = await postOrderMessage("ord-42", { content: "  hello  " }, "idem-msg-1");
    expect(data).toMatchObject({ status: "ok", id: "msg-new" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderMessages("ord-42")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "  hello  " }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-msg-1",
          "X-Idempotency-Key": "idem-msg-1",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "rate_limit_exceeded" })
    );
    await expect(postOrderMessage("o", { content: "x" }, "k")).rejects.toThrow();
  });
});
