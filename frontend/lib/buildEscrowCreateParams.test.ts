import { describe, expect, it } from "vitest";
import { buildEscrowCreateParams } from "./buildEscrowCreateParams";
import type { ItineraryBlock, OrderRow } from "@/components/escrow/EscrowDetail/types";

const ORDER_UUID = "11111111-1111-1111-1111-111111111111";
const SNAP32 = `0x${"ab".repeat(32)}` as `0x${string}`;
const ADDR = (n: number) =>
  `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

function baseOrder(over: Partial<OrderRow> = {}): OrderRow {
  return {
    id: ORDER_UUID,
    amount: "100",
    travel_date: "2026-06-01",
    days: 3,
    ...over,
  };
}

describe("buildEscrowCreateParams", () => {
  const base = {
    itinerary: null as ItineraryBlock | null,
    snapshotHash: SNAP32,
    traveler: ADDR(1),
    guide: ADDR(2),
    token: ADDR(3),
    arbitrator: ADDR(4),
    chainId: BigInt(137),
    disputeWindowSeconds: 86_400,
  };

  it("returns invalid_order_id when id is not a UUID bytes32 source", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ id: "not-a-valid-uuid" }),
    });
    expect(r).toEqual({ ok: false, code: "invalid_order_id" });
  });

  it("returns missing_snapshot when snapshot is empty", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder(),
      snapshotHash: "   ",
    });
    expect(r).toEqual({ ok: false, code: "missing_snapshot" });
  });

  it("returns invalid_snapshot when not 32-byte hex", () => {
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder(),
        snapshotHash: "0x00",
      })
    ).toEqual({ ok: false, code: "invalid_snapshot" });
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder(),
        snapshotHash: `0x${"00".repeat(31)}`,
      })
    ).toEqual({ ok: false, code: "invalid_snapshot" });
  });

  it("returns missing_order_amount when amount missing or invalid", () => {
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder({ amount: undefined }),
      })
    ).toEqual({ ok: false, code: "missing_order_amount" });
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder({ amount: "" }),
      })
    ).toEqual({ ok: false, code: "missing_order_amount" });
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder({ amount: "xx" }),
      })
    ).toEqual({ ok: false, code: "missing_order_amount" });
  });

  it("returns missing_traveler / guide / token / arbitrator when empty", () => {
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), traveler: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_traveler" });
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), guide: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_guide" });
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), token: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_token" });
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), arbitrator: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_arbitrator" });
  });

  it("returns ok with params: orderId, USDC amount, travel window, platformFeeBps from breakdown", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ amount: "250.5" }),
      itinerary: {
        amount_breakdown: {
          total_budget: 1000,
          platform_fee: 50,
        },
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.params.orderId).toMatch(/^0x[0-9a-f]{64}$/);
    expect(r.params.snapshotHash).toBe(SNAP32);
    expect(r.params.totalAmount).toBe(BigInt(250_500_000));
    expect(r.params.platformFeeBps).toBe(500);
    expect(r.params.traveler).toBe(ADDR(1));
    expect(r.params.guide).toBe(ADDR(2));
    expect(r.params.chainId).toBe(BigInt(137));
    expect(r.params.disputeWindowSeconds).toBe(86_400);
    const start = Number(r.params.serviceStart);
    const end = Number(r.params.serviceEnd);
    expect(end).toBe(start + 3 * 86_400);
    expect(start).toBe(Math.floor(new Date("2026-06-01T00:00:00.000Z").getTime() / 1000));
  });

  it("uses order amount for platform bps denominator when total_budget absent", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ amount: "200" }),
      itinerary: {
        amount_breakdown: {
          platform_fee: 20,
        },
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.params.platformFeeBps).toBe(1000);
  });

  it("parses order amount with commas for breakdown fallback denominator", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ amount: "1,234.5" }),
      itinerary: {
        amount_breakdown: {
          platform_fee: 123.45,
        },
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.params.platformFeeBps).toBe(1000);
  });

  it("uses 7-day fallback travel window when travel_date is not YYYY-MM-DD", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ travel_date: "06/01/2026", days: 99 }),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const span = Number(r.params.serviceEnd - r.params.serviceStart);
    expect(span).toBe(7 * 86_400);
  });

  it("uses order amount as denominator when total_budget is 0", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ amount: "400" }),
      itinerary: {
        amount_breakdown: {
          total_budget: 0,
          platform_fee: 40,
        },
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.params.platformFeeBps).toBe(1000);
  });

  it("clamps platformFeeBps to 10000 when fee exceeds budget", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ amount: "100" }),
      itinerary: {
        amount_breakdown: {
          total_budget: 100,
          platform_fee: 500,
        },
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.params.platformFeeBps).toBe(10_000);
  });

  it("defaults travel span to 1 day when days is 0 or negative", () => {
    const startTs = Math.floor(new Date("2026-06-01T00:00:00.000Z").getTime() / 1000);
    for (const days of [0, -3]) {
      const r = buildEscrowCreateParams({
        ...base,
        order: baseOrder({ travel_date: "2026-06-01", days }),
      });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(Number(r.params.serviceStart)).toBe(startTs);
      expect(Number(r.params.serviceEnd)).toBe(startTs + 86_400);
    }
  });

  it("accepts days as numeric string (API JSON shape)", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: { ...baseOrder(), travel_date: "2026-06-01", days: "5" } as OrderRow,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const startTs = Math.floor(new Date("2026-06-01T00:00:00.000Z").getTime() / 1000);
    expect(Number(r.params.serviceStart)).toBe(startTs);
    expect(Number(r.params.serviceEnd)).toBe(startTs + 5 * 86_400);
  });

  it("ignores non-integer days strings and falls back to 1 day", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: { ...baseOrder(), travel_date: "2026-06-01", days: "3.5" } as OrderRow,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const startTs = Math.floor(new Date("2026-06-01T00:00:00.000Z").getTime() / 1000);
    expect(Number(r.params.serviceEnd - r.params.serviceStart)).toBe(86_400);
  });
});
