/**
 * 双边确认、评分确认、争议、mock 支付、确认完成（04/53；Escrow 动作链）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  orderConfirmBilateral,
  orderConfirmRating,
  postOrderDispute,
  orderMockPay,
  orderConfirmCompletion,
} from "./orders";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("orderConfirmBilateral (53-S6)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs confirm-bilateral with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await orderConfirmBilateral("ord-bi", "idem-bi");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderConfirmBilateral("ord-bi")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-bi" }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_state" })
    );
    await expect(orderConfirmBilateral("o", "k")).rejects.toThrow();
  });
});

describe("orderConfirmRating (53-S8)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs confirm-rating with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await orderConfirmRating("ord-rt", "idem-rt");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderConfirmRating("ord-rt")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-rt" }),
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "order_not_final_financial_state" })
    );
    await expect(orderConfirmRating("o", "k")).rejects.toThrow();
  });
});

describe("postOrderDispute", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs JSON body when provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postOrderDispute("ord-d", { reason: "x" }, "idem-d");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderDispute("ord-d")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "x" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("POSTs {} when body omitted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await postOrderDispute("ord-d2", undefined, "idem-d2");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderDispute("ord-d2")),
      expect.objectContaining({
        method: "POST",
        body: "{}",
      })
    );
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_state" })
    );
    await expect(postOrderDispute("o", {}, "k")).rejects.toThrow();
  });
});

describe("orderMockPay (P3)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs mock-pay with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await orderMockPay("ord-mp", "idem-mp");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderMockPay("ord-mp")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-mp" }),
      })
    );
  });
});

describe("orderConfirmCompletion", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs confirm-completion with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await orderConfirmCompletion("ord-cc", "idem-cc");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderConfirmCompletion("ord-cc")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Idempotency-Key": "idem-cc" }),
      })
    );
  });
});
