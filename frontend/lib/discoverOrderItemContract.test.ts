/**
 * 04 §3.4 `GET /api/v1/discover/orders` item 可选 52 字段 — 与 chain_off discover_card_json、OrderCardItem 对齐
 */
import { describe, it, expect } from "vitest";
import { MOCK_ORDERS } from "./marketMockData";

function expectOptionalDiscover52Extensions(item: Record<string, unknown>) {
  if (item.breakdown != null) {
    expect(typeof item.breakdown).toBe("object");
    const b = item.breakdown as Record<string, unknown>;
    for (const k of ["guideFee", "carFee", "hotel", "food", "tickets", "misc"] as const) {
      if (b[k] != null) expect(typeof b[k]).toBe("number");
    }
  }
  if (item.itinerary != null) {
    expect(typeof item.itinerary).toBe("object");
    const it = item.itinerary as Record<string, unknown>;
    if (it.daily_itinerary != null) {
      expect(Array.isArray(it.daily_itinerary)).toBe(true);
      const row = (it.daily_itinerary as unknown[])[0];
      if (row != null && typeof row === "object") {
        expect(row as Record<string, unknown>).toHaveProperty("day_index");
      }
    }
    if (it.amount_breakdown != null) {
      expect(typeof it.amount_breakdown).toBe("object");
    }
  }
}

describe("discover order item contract (07 §5.2 / 52)", () => {
  it("MOCK_ORDERS[0] embeds itinerary + breakdown for offline drawer / UI demos", () => {
    const o = MOCK_ORDERS[0] as unknown as Record<string, unknown>;
    expect(o.itinerary).toBeDefined();
    expectOptionalDiscover52Extensions(o);
    const it = o.itinerary as Record<string, unknown>;
    expect(Array.isArray(it.daily_itinerary)).toBe(true);
    expect((it.daily_itinerary as unknown[]).length).toBeGreaterThan(0);
    const ab = it.amount_breakdown as Record<string, unknown>;
    expect(typeof ab.total_budget).toBe("number");
  });
});
