/** `/market` URL query SSOT：排序与高级筛选展开态（与 `useMarketPage` 双向同步） */

export type MarketPageSortKey = "latest" | "priceDesc" | "priceAsc";

export const MARKET_PAGE_SORT_QUERY = "sort";
export const MARKET_PAGE_FILTER_EXPANDED_QUERY = "filters";

const SORT_KEYS: readonly MarketPageSortKey[] = ["latest", "priceDesc", "priceAsc"];

export function parseMarketPageSortParam(raw: string | null | undefined): MarketPageSortKey {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "price_desc" || s === "pricedesc") return "priceDesc";
  if (s === "price_asc" || s === "priceasc") return "priceAsc";
  if (SORT_KEYS.includes(s as MarketPageSortKey)) return s as MarketPageSortKey;
  return "latest";
}

export function serializeMarketPageSortParam(sort: MarketPageSortKey): string | null {
  if (sort === "latest") return null;
  if (sort === "priceDesc") return "price_desc";
  if (sort === "priceAsc") return "price_asc";
  return null;
}

export function parseMarketPageFilterExpandedParam(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim().toLowerCase();
  return s === "open" || s === "1" || s === "expanded";
}

export function serializeMarketPageFilterExpandedParam(expanded: boolean): string | null {
  return expanded ? "open" : null;
}

export function countMarketAdvancedFilterSelections(args: {
  city: string;
  languages: readonly string[];
  serviceTypes: readonly string[];
  tripDaysFilter: number | null;
}): number {
  let n = 0;
  if (args.city.trim()) n += 1;
  n += args.languages.length;
  n += args.serviceTypes.length;
  if (args.tripDaysFilter != null) n += 1;
  return n;
}
