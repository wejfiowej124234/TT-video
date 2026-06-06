/**
 * Escrow 回写、接单、最终行程确认（04/53/14）；与 EscrowDetail、OrderActions 一致
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { postOrderSetEscrowAddress, orderAccept, postOrderConfirmFinalPlan } from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("postOrderSetEscrowAddress", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs escrow_address JSON with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    const out = await postOrderSetEscrowAddress("ord-1", "0xabc", "idem-esc");
    expect(out).toEqual({ status: "ok" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderSetEscrowAddress("ord-1")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ escrow_address: "0xabc" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-esc",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_state" })
    );
    await expect(postOrderSetEscrowAddress("o", "0x", "k")).rejects.toThrow();
  });

  it("rejects HTTP 503 chain_off_unavailable (set_order_escrow_address)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(postOrderSetEscrowAddress("550e8400-e29b-41d4-a716-446655440000", "0x1", "k")).rejects.toThrow(
      "chain_off_unavailable"
    );
  });
});

describe("orderAccept", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs accept route with idempotency headers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok" })
    );
    await orderAccept("ord-acc", "idem-acc");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderAccept("ord-acc")),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "idem-acc",
          "X-Idempotency-Key": "idem-acc",
        }),
      })
    );
  });

  it("rejects when envelope status is error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "invalid_state" })
    );
    await expect(orderAccept("o", "k")).rejects.toThrow();
  });

  it("rejects HTTP 503 chain_off_unavailable (order_accept)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(false, { error: "chain_off_unavailable", message: "chain_off_unavailable" }, 503)
    );
    await expect(orderAccept("550e8400-e29b-41d4-a716-446655440000", "k")).rejects.toThrow(
      "chain_off_unavailable"
    );
  });
});

describe("postOrderConfirmFinalPlan", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs expected_version and returns ok/status/data without throwing on HTTP 409", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: "version_conflict", current_version: 7 }),
    });
    const r = await postOrderConfirmFinalPlan("ord-fp", { expected_version: 5 }, "idem-fp");
    expect(r).toEqual({
      ok: false,
      status: 409,
      data: { error: "version_conflict", current_version: 7 },
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.orderConfirmFinalPlan("ord-fp")),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ expected_version: 5 }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "idem-fp",
        }),
      })
    );
  });

  it("returns ok true when HTTP 2xx and body status ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    const r = await postOrderConfirmFinalPlan("o", { expected_version: 1 }, "k");
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(r.data).toEqual({ status: "ok" });
  });

  it("returns ok false on HTTP 503 chain_off_unavailable without parseResponse throw", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: "chain_off_unavailable", message: "chain_off_unavailable" }),
    });
    const r = await postOrderConfirmFinalPlan("550e8400-e29b-41d4-a716-446655440000", { expected_version: 1 }, "k");
    expect(r.ok).toBe(false);
    expect(r.status).toBe(503);
    expect(r.data).toMatchObject({ error: "chain_off_unavailable" });
  });
});
