import type { GuideCardItem } from "@/lib/marketTypes";

/** Short TTL: view 切换 / 300ms 防抖内相同筛选不重复 `GET /guides`。 */
export const MARKET_GUIDES_LIST_CACHE_TTL_MS = 30_000;

type MarketGuidesListCacheEntry = {
  key: string;
  guides: GuideCardItem[];
  hasMore: boolean;
  nextCursor: string | null;
  fetchedAt: number;
};

let marketGuidesListCache: MarketGuidesListCacheEntry | null = null;

export function buildMarketGuidesListCacheKey(
  filterState: { country: string; city: string; languages: string[]; serviceTypes: string[] },
  apiParams: Record<string, unknown>,
): string {
  return JSON.stringify({
    country: filterState.country.trim(),
    city: filterState.city.trim(),
    languages: [...filterState.languages].sort(),
    serviceTypes: [...filterState.serviceTypes].sort(),
    apiParams,
  });
}

export function readMarketGuidesListCache(key: string): Omit<MarketGuidesListCacheEntry, "fetchedAt"> | null {
  const now = Date.now();
  if (
    marketGuidesListCache &&
    marketGuidesListCache.key === key &&
    now - marketGuidesListCache.fetchedAt < MARKET_GUIDES_LIST_CACHE_TTL_MS
  ) {
    return {
      key: marketGuidesListCache.key,
      guides: marketGuidesListCache.guides,
      hasMore: marketGuidesListCache.hasMore,
      nextCursor: marketGuidesListCache.nextCursor,
    };
  }
  return null;
}

export function writeMarketGuidesListCache(entry: Omit<MarketGuidesListCacheEntry, "fetchedAt">): void {
  marketGuidesListCache = { ...entry, fetchedAt: Date.now() };
}

export function invalidateMarketGuidesListCache(): void {
  marketGuidesListCache = null;
}
