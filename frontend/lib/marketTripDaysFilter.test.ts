import { describe, expect, it } from "vitest";
import type { OrderCardItem } from "@/lib/marketTypes";
import {
  applyMarketTripDaysFilterToOrders,
  normalizeOrderTripDays,
  orderMatchesTripDaysFilter,
  parseMarketTripDaysParam,
} from "./marketTripDaysFilter";
import { appendMarketDevVarietyOrders } from "./marketDevVarietyOrders";

describe("marketTripDaysFilter", () => {
  it("parses URL days param for any trip length 1..30", () => {
    expect(parseMarketTripDaysParam("7")).toBe(7);
    expect(parseMarketTripDaysParam("2")).toBe(2);
    expect(parseMarketTripDaysParam("4")).toBe(4);
    expect(parseMarketTripDaysParam("")).toBeNull();
  });

  it("normalizes string days from API", () => {
    expect(normalizeOrderTripDays("3")).toBe(3);
    expect(orderMatchesTripDaysFilter("3", 3)).toBe(true);
    expect(orderMatchesTripDaysFilter("3", 7)).toBe(false);
  });

  it("pipeline: filter 7 excludes 3/5 demo injection when dev variety enabled", () => {
    const base: OrderCardItem[] = [{ id: "api-1", days: 1, destination: "北京" }];
    const withDemo = appendMarketDevVarietyOrders(base, { tripDaysFilter: 7 });
    const out = applyMarketTripDaysFilterToOrders(withDemo, 7);
    expect(out.every((o) => o.days === 7)).toBe(true);
    if (withDemo.length > base.length) {
      expect(out.length).toBeGreaterThanOrEqual(1);
    } else {
      expect(out.length).toBe(0);
    }
  });

  it("keeps bind pin when days filter would drop it", () => {
    const list: OrderCardItem[] = [
      { id: "bind-me", days: 3, destination: "上海" },
      { id: "other", days: 3, destination: "北京" },
    ];
    const out = applyMarketTripDaysFilterToOrders(list, 7, "bind-me");
    expect(out.map((o) => o.id)).toEqual(["bind-me"]);
  });

  it("keeps own published open listings when days filter would drop them", () => {
    const list: OrderCardItem[] = [
      { id: "mine-7", days: 7, destination: "中国", tourist_id: "u1", state: "created" },
      { id: "mine-4", days: 4, destination: "中国", tourist_id: "u1", state: "created" },
      { id: "other-7", days: 7, destination: "日本" },
    ];
    const ownIds = new Set(["mine-7", "mine-4"]);
    const out = applyMarketTripDaysFilterToOrders(list, 7, undefined, ownIds);
    expect(out.map((o) => o.id).sort()).toEqual(["mine-4", "mine-7", "other-7"]);
  });
});
