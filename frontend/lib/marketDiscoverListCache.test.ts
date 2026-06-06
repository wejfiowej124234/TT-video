import { beforeEach, describe, expect, it } from "vitest";
import type { OrderCardItem } from "@/lib/marketTypes";
import {
  buildMarketDiscoverListCacheKey,
  invalidateMarketDiscoverListCache,
  readMarketDiscoverListCache,
  writeMarketDiscoverListCache,
} from "./marketDiscoverListCache";

const sampleOrders: OrderCardItem[] = [{ id: "o1", state: "created", amount: "100" }];

describe("marketDiscoverListCache", () => {
  beforeEach(() => {
    invalidateMarketDiscoverListCache();
  });

  it("returns cached discover page for identical key within TTL", () => {
    const key = buildMarketDiscoverListCacheKey({ country: "日本", city: "东京", bindGuideOrderId: "" });
    writeMarketDiscoverListCache({
      key,
      orders: sampleOrders,
      hasMore: true,
      nextCursor: "c2",
    });
    const hit = readMarketDiscoverListCache(key);
    expect(hit?.orders).toEqual(sampleOrders);
    expect(hit?.hasMore).toBe(true);
    expect(hit?.nextCursor).toBe("c2");
  });

  it("invalidate clears discover cache", () => {
    const key = buildMarketDiscoverListCacheKey({ bindGuideOrderId: "00000000-0000-0000-0000-000000000001" });
    writeMarketDiscoverListCache({ key, orders: sampleOrders, hasMore: false, nextCursor: null });
    invalidateMarketDiscoverListCache();
    expect(readMarketDiscoverListCache(key)).toBeNull();
  });
});
