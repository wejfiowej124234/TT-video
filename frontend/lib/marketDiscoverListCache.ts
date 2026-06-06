import type { OrderCardItem } from "@/lib/marketTypes";

/** Short TTL: 300ms 防抖 / 视图切换内相同 discover 参数不重复首屏拉取。 */
export const MARKET_DISCOVER_LIST_CACHE_TTL_MS = 30_000;

type MarketDiscoverListCacheEntry = {
  key: string;
  orders: OrderCardItem[];
  hasMore: boolean;
  nextCursor: string | null;
  fetchedAt: number;
};

let marketDiscoverListCache: MarketDiscoverListCacheEntry | null = null;

export function buildMarketDiscoverListCacheKey(params: {
  country?: string;
  city?: string;
  days?: number;
  bindGuideOrderId: string;
}): string {
  return JSON.stringify({
    country: params.country?.trim() ?? "",
    city: params.city?.trim() ?? "",
    days: params.days ?? null,
    bindGuideOrderId: params.bindGuideOrderId.trim(),
  });
}

export function readMarketDiscoverListCache(
  key: string,
): Omit<MarketDiscoverListCacheEntry, "fetchedAt"> | null {
  const now = Date.now();
  if (
    marketDiscoverListCache &&
    marketDiscoverListCache.key === key &&
    now - marketDiscoverListCache.fetchedAt < MARKET_DISCOVER_LIST_CACHE_TTL_MS
  ) {
    return {
      key: marketDiscoverListCache.key,
      orders: marketDiscoverListCache.orders,
      hasMore: marketDiscoverListCache.hasMore,
      nextCursor: marketDiscoverListCache.nextCursor,
    };
  }
  return null;
}

export function writeMarketDiscoverListCache(
  entry: Omit<MarketDiscoverListCacheEntry, "fetchedAt">,
): void {
  marketDiscoverListCache = { ...entry, fetchedAt: Date.now() };
}

export function invalidateMarketDiscoverListCache(): void {
  marketDiscoverListCache = null;
}
