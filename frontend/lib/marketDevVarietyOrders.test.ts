import { describe, expect, it, vi, afterEach } from "vitest";
import {
  appendMarketDevVarietyOrders,
  findMarketDevVarietyOrderById,
  isMarketDevVarietyOrderId,
} from "./marketDevVarietyOrders";
import type { OrderCardItem } from "@/lib/marketTypes";

describe("marketDevVarietyOrders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not append demo cards unless NEXT_PUBLIC_MARKET_DEV_VARIETY=1", () => {
    vi.stubEnv("NEXT_PUBLIC_MARKET_DEV_VARIETY", "");
    const base: OrderCardItem[] = [{ id: "api-1", days: 1, destination: "北京" }];
    expect(appendMarketDevVarietyOrders(base)).toEqual(base);
  });

  it("appends 3d and 5d cards when dev variety enabled and list has no multi-day orders", () => {
    vi.stubEnv("NEXT_PUBLIC_MARKET_DEV_VARIETY", "1");
    const base: OrderCardItem[] = [{ id: "api-1", days: 1, destination: "北京" }];
    const out = appendMarketDevVarietyOrders(base);
    expect(out.length).toBe(3);
    expect(out.some((o) => o.days === 3)).toBe(true);
    expect(out.some((o) => o.days === 5)).toBe(true);
    expect(out.some((o) => o.days === 7)).toBe(false);
  });

  it("with tripDaysFilter=7 only adds 7-day demo when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_MARKET_DEV_VARIETY", "1");
    const base: OrderCardItem[] = [{ id: "api-1", days: 1, destination: "北京" }];
    const out = appendMarketDevVarietyOrders(base, { tripDaysFilter: 7 });
    expect(out.some((o) => o.days === 7)).toBe(true);
    expect(out.some((o) => o.days === 3)).toBe(false);
  });

  it("findMarketDevVarietyOrderById resolves dev-only ids when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_MARKET_DEV_VARIETY", "1");
    const hit = findMarketDevVarietyOrderById("00000000-0000-4000-8000-000000000007");
    expect(hit?.days).toBe(7);
    expect(findMarketDevVarietyOrderById("missing")).toBeNull();
  });

  it("isMarketDevVarietyOrderId flags local preview cards when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_MARKET_DEV_VARIETY", "1");
    expect(isMarketDevVarietyOrderId("00000000-0000-4000-8000-000000000007")).toBe(true);
    expect(isMarketDevVarietyOrderId("real-order-id")).toBe(false);
  });
});
