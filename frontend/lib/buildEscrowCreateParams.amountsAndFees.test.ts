import { describe, expect, it } from "vitest";
import { buildEscrowCreateParams } from "./buildEscrowCreateParams";
import { ADDR, SNAP32, baseOrder, buildEscrowCreateParamsTestBase } from "./buildEscrowCreateParams.vitestShared";

describe("buildEscrowCreateParams · amounts & platform fee", () => {
  const base = buildEscrowCreateParamsTestBase();

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
});
