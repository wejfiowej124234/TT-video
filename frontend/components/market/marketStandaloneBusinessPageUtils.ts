import type { MarketSubsiteMasonryItem } from "@/components/market/MarketSubsiteMasonry";
import {
  getMarketAcquisitionListings,
  getMarketProviderListings,
} from "@/lib/apiClient/marketSubsite";
import type { Locale } from "@/lib/i18n";
import {
  catalogRowToDemoAcquisitionListing,
  catalogRowToDemoMerchantListing,
  parseMarketCatalogListRows,
  type MarketCatalogListRow,
} from "@/lib/marketCatalogAdapter";
import {
  applyMarketSubsiteAcquisitionFilters,
  applyMarketSubsiteProviderFilters,
  buildMarketSubsiteListingsQueryString,
  parseAcquisitionCategoryParam,
  parseAcquisitionSortParam,
  parseCountryParam,
  parseMerchantCategoryParam,
  parseMerchantSortParam,
  resolveEffectiveSubsiteCountry,
  type MarketSubsiteCountryParam,
} from "@/lib/marketSubsiteFilters";
import {
  demoAcquisitionListingIds,
  demoMerchantListingIds,
  getDemoAcquisitionListing,
  getDemoMerchantListing,
  pickL10n,
  type DemoAcquisitionListing,
  type DemoMerchantListing,
} from "@/lib/marketSubsiteDemo";

export function pushWithListingParam(pathname: string, searchParams: URLSearchParams, listingId: string | null): string {
  const sp = new URLSearchParams(searchParams.toString());
  if (listingId) sp.set("listing", listingId);
  else sp.delete("listing");
  const q = sp.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function merchantToMasonryItem(d: DemoMerchantListing, locale: Locale): MarketSubsiteMasonryItem {
  return {
    href: `/market/provider/showcase/${d.id}`,
    listingId: d.id,
    imageSrc: d.imageSrc,
    imageAlt: pickL10n(d.title, locale),
    title: pickL10n(d.title, locale),
    subtitle: pickL10n(d.subtitle, locale),
    footer: pickL10n(d.shopName, locale),
    pill: pickL10n(d.city, locale),
    meta: `${d.priceUsdc} USDC`,
  };
}

export function acquisitionToMasonryItem(d: DemoAcquisitionListing, locale: Locale): MarketSubsiteMasonryItem {
  const { bountyMinUsdc, bountyMaxUsdc } = d;
  const meta =
    bountyMinUsdc === bountyMaxUsdc
      ? `${bountyMinUsdc} USDC`
      : `${bountyMinUsdc} – ${bountyMaxUsdc} USDC`;
  return {
    listingKind: "acquisition",
    href: `/market/acquisition/${d.id}`,
    listingId: d.id,
    imageSrc: d.imageSrc,
    imageAlt: pickL10n(d.title, locale),
    title: pickL10n(d.title, locale),
    subtitle: pickL10n(d.summary, locale),
    footer: pickL10n(d.route, locale),
    pill: pickL10n(d.deadlineNote, locale),
    meta,
  };
}

export function demoMasonryItems(variant: "provider" | "acquisition", locale: Locale): MarketSubsiteMasonryItem[] {
  if (variant === "provider") {
    return demoMerchantListingIds()
      .map((id) => getDemoMerchantListing(id))
      .filter((x): x is DemoMerchantListing => x != null)
      .map((d) => merchantToMasonryItem(d, locale));
  }
  return demoAcquisitionListingIds()
    .map((id) => getDemoAcquisitionListing(id))
    .filter((x): x is DemoAcquisitionListing => x != null)
    .map((d) => acquisitionToMasonryItem(d, locale));
}

/** 目录 **`GET …/market/{segment}/listings`** → 瀑布流行 + 是否 PG 真源（与 **`MarketSubsiteMasonry`** / 抽屉 **`catalogSourced`** 同源）。 */
const SUBSITE_CATALOG_CACHE_TTL_MS = 30_000;
type SubsiteCatalogCacheEntry = {
  key: string;
  rows: MarketCatalogListRow[];
  catalogSourced: boolean;
  catalogHasMore: boolean;
  fetchedAt: number;
};
let subsiteCatalogCache: SubsiteCatalogCacheEntry | null = null;

function subsiteCatalogCacheKey(isProvider: boolean, filterQuery?: string): string {
  return `${isProvider ? "provider" : "acquisition"}:${filterQuery?.trim() ?? ""}`;
}

export function invalidateMarketStandaloneCatalogCache(): void {
  subsiteCatalogCache = null;
}

export async function fetchMarketStandaloneCatalog(
  isProvider: boolean,
  filterQuery?: string,
  options: { bypassCache?: boolean } = {},
): Promise<{
  rows: MarketCatalogListRow[];
  catalogSourced: boolean;
  catalogHasMore: boolean;
}> {
  const cacheKey = subsiteCatalogCacheKey(isProvider, filterQuery);
  const now = Date.now();
  if (
    !options.bypassCache &&
    subsiteCatalogCache &&
    subsiteCatalogCache.key === cacheKey &&
    now - subsiteCatalogCache.fetchedAt < SUBSITE_CATALOG_CACHE_TTL_MS
  ) {
    return {
      rows: subsiteCatalogCache.rows,
      catalogSourced: subsiteCatalogCache.catalogSourced,
      catalogHasMore: subsiteCatalogCache.catalogHasMore,
    };
  }

  const res = isProvider
    ? await getMarketProviderListings(filterQuery)
    : await getMarketAcquisitionListings(filterQuery);
  const apiCatalog = res.meta?.source === "postgres_catalog" && !res.isPlaceholderCatalog;
  const parsed = parseMarketCatalogListRows(
    res.items,
    apiCatalog ? "postgres_catalog" : undefined,
  );
  const filtersActive = Boolean(filterQuery?.trim());
  const catalogSourced = Boolean(apiCatalog) && (parsed.length > 0 || filtersActive);
  const catalogHasMore = apiCatalog && res.meta?.has_more === true;
  subsiteCatalogCache = {
    key: cacheKey,
    rows: parsed,
    catalogSourced,
    catalogHasMore,
    fetchedAt: now,
  };
  return { rows: parsed, catalogSourced, catalogHasMore };
}

export type MarketSubsiteFilterState = {
  country: MarketSubsiteCountryParam;
  categoryMerchant: ReturnType<typeof parseMerchantCategoryParam>;
  categoryAcquisition: ReturnType<typeof parseAcquisitionCategoryParam>;
  sortMerchant: ReturnType<typeof parseMerchantSortParam>;
  sortAcquisition: ReturnType<typeof parseAcquisitionSortParam>;
};

/** PG 目录行或演示数据 → 统一 filter/sort → 瀑布流（catalog 与 demo 同逻辑）。 */
export function buildFilteredSubsiteMasonryItems(args: {
  variant: "provider" | "acquisition";
  catalogRows: MarketCatalogListRow[];
  catalogSourced: boolean;
  demoAllowed: boolean;
  filters: MarketSubsiteFilterState;
  locale: Locale;
}): MarketSubsiteMasonryItem[] {
  const { variant, catalogRows, catalogSourced, demoAllowed, filters, locale } = args;
  const isProvider = variant === "provider";

  if (catalogSourced) {
    if (isProvider) {
      return catalogRows
        .map((row) => merchantToMasonryItem(catalogRowToDemoMerchantListing(row), locale));
    }
    return catalogRows.map((row) =>
      acquisitionToMasonryItem(catalogRowToDemoAcquisitionListing(row), locale),
    );
  }

  if (!demoAllowed) return [];

  if (isProvider) {
    const raw = demoMerchantListingIds()
      .map((id) => getDemoMerchantListing(id))
      .filter((x): x is DemoMerchantListing => x != null);
    const filtered = applyMarketSubsiteProviderFilters(
      raw,
      filters.country,
      filters.categoryMerchant,
      filters.sortMerchant,
    );
    return filtered.map((d) => merchantToMasonryItem(d, locale));
  }

  const raw = demoAcquisitionListingIds()
    .map((id) => getDemoAcquisitionListing(id))
    .filter((x): x is DemoAcquisitionListing => x != null);
  const filtered = applyMarketSubsiteAcquisitionFilters(
    raw,
    filters.country,
    filters.categoryAcquisition,
    filters.sortAcquisition,
  );
  return filtered.map((d) => acquisitionToMasonryItem(d, locale));
}

export function marketSubsiteFilterStateFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): MarketSubsiteFilterState {
  return {
    country: parseCountryParam(searchParams.get("country")),
    categoryMerchant: parseMerchantCategoryParam(searchParams.get("category")),
    categoryAcquisition: parseAcquisitionCategoryParam(searchParams.get("category")),
    sortMerchant: parseMerchantSortParam(searchParams.get("sort")),
    sortAcquisition: parseAcquisitionSortParam(searchParams.get("sort")),
  };
}

export function marketSubsiteListingsQueryFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
  variant: "provider" | "acquisition",
  effectiveCountry?: MarketSubsiteCountryParam,
): string {
  const filters = marketSubsiteFilterStateFromSearchParams(searchParams);
  const country = effectiveCountry ?? resolveEffectiveSubsiteCountry(searchParams, variant);
  const isProvider = variant === "provider";
  return buildMarketSubsiteListingsQueryString({
    country,
    category: isProvider ? filters.categoryMerchant : filters.categoryAcquisition,
    sort: isProvider ? filters.sortMerchant : filters.sortAcquisition,
  });
}

export function marketSubsiteFilterStateEffective(
  searchParams: Pick<URLSearchParams, "get">,
  variant: "provider" | "acquisition",
): MarketSubsiteFilterState {
  const base = marketSubsiteFilterStateFromSearchParams(searchParams);
  return { ...base, country: resolveEffectiveSubsiteCountry(searchParams, variant) };
}
