import type { ProductCountryIso } from "@/lib/productCountries";
import { isAllowedProductIso3166 } from "@/lib/productCountries";
import type {
  AcquisitionCategorySlug,
  DemoAcquisitionListing,
  DemoMerchantListing,
  MerchantCategorySlug,
} from "@/lib/marketSubsiteDemo";
export type MarketSubsiteCountryParam = "all" | ProductCountryIso;

/** 子站列表页：详情抽屉与 URL 同步的 query 键（商家橱窗 / 旅行收购「查看详情」→ 右侧抽屉） */
export const MARKET_SUBSITE_LISTING_QUERY = "listing";

export const MERCHANT_CATEGORY_SLUGS: MerchantCategorySlug[] = ["hotel", "dining", "attraction", "experience"];

export const ACQUISITION_CATEGORY_SLUGS: AcquisitionCategorySlug[] = [
  "luxury",
  "sneakers",
  "electronics",
  "health",
  "accessories",
];

export type MerchantSortId = "recent" | "price_asc" | "price_desc";
export type AcquisitionSortId = "recent" | "bounty_desc";

const MERCHANT_SORTS: MerchantSortId[] = ["recent", "price_asc", "price_desc"];
const ACQUISITION_SORTS: AcquisitionSortId[] = ["recent", "bounty_desc"];

export function parseCountryParam(raw: string | null): MarketSubsiteCountryParam {
  if (!raw || raw === "all") return "all";
  const u = raw.trim().toUpperCase();
  if (isAllowedProductIso3166(u)) return u as ProductCountryIso;
  return "all";
}

export function parseMerchantCategoryParam(raw: string | null): "all" | MerchantCategorySlug {
  if (!raw || raw === "all") return "all";
  return MERCHANT_CATEGORY_SLUGS.includes(raw as MerchantCategorySlug) ? (raw as MerchantCategorySlug) : "all";
}

export function parseAcquisitionCategoryParam(raw: string | null): "all" | AcquisitionCategorySlug {
  if (!raw || raw === "all") return "all";
  return ACQUISITION_CATEGORY_SLUGS.includes(raw as AcquisitionCategorySlug) ? (raw as AcquisitionCategorySlug) : "all";
}

export function parseMerchantSortParam(raw: string | null): MerchantSortId {
  if (!raw) return "recent";
  return MERCHANT_SORTS.includes(raw as MerchantSortId) ? (raw as MerchantSortId) : "recent";
}

export function parseAcquisitionSortParam(raw: string | null): AcquisitionSortId {
  if (!raw) return "recent";
  return ACQUISITION_SORTS.includes(raw as AcquisitionSortId) ? (raw as AcquisitionSortId) : "recent";
}

export function filterMerchantListings(
  list: DemoMerchantListing[],
  country: MarketSubsiteCountryParam,
  category: "all" | MerchantCategorySlug,
): DemoMerchantListing[] {
  return list.filter((row) => {
    if (country !== "all" && row.countryIso !== country) return false;
    if (category !== "all" && row.categorySlug !== category) return false;
    return true;
  });
}

export function sortMerchantListings(list: DemoMerchantListing[], sort: MerchantSortId): DemoMerchantListing[] {
  const out = [...list];
  if (sort === "price_asc") out.sort((a, b) => a.priceUsdc - b.priceUsdc);
  else if (sort === "price_desc") out.sort((a, b) => b.priceUsdc - a.priceUsdc);
  else out.sort((a, b) => b.sortKey - a.sortKey);
  return out;
}

export function filterAcquisitionListings(
  list: DemoAcquisitionListing[],
  country: MarketSubsiteCountryParam,
  category: "all" | AcquisitionCategorySlug,
): DemoAcquisitionListing[] {
  return list.filter((row) => {
    if (country !== "all" && row.destinationCountryIso !== country) return false;
    if (category !== "all" && row.categorySlug !== category) return false;
    return true;
  });
}

export function sortAcquisitionListings(list: DemoAcquisitionListing[], sort: AcquisitionSortId): DemoAcquisitionListing[] {
  const out = [...list];
  if (sort === "bounty_desc") out.sort((a, b) => b.bountyMaxUsdc - a.bountyMaxUsdc);
  else out.sort((a, b) => b.sortKey - a.sortKey);
  return out;
}

export const MARKET_SUBSITE_COUNTRY_STORAGE = {
  provider: "tt_market_subsite_country_pref_provider",
  acquisition: "tt_market_subsite_country_pref_acquisition",
} as const;

/** Set only when user explicitly picks a country pill (not on init / URL sync). */
export const MARKET_SUBSITE_COUNTRY_SAVED_STORAGE = {
  provider: "tt_market_subsite_country_pref_provider_saved",
  acquisition: "tt_market_subsite_country_pref_acquisition_saved",
} as const;

export function hasExplicitSubsiteCountryPref(
  variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MARKET_SUBSITE_COUNTRY_SAVED_STORAGE[variant]) === "1";
  } catch {
    return false;
  }
}

export function clearSubsiteCountryPref(variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant]);
    localStorage.removeItem(MARKET_SUBSITE_COUNTRY_SAVED_STORAGE[variant]);
  } catch {
    /* ignore */
  }
}

/** User picked a country pill — persist for next visit (explicit save only). */
export function writeSubsiteCountryPref(
  variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE,
  country: MarketSubsiteCountryParam,
): void {
  if (typeof window === "undefined") return;
  if (country === "all") {
    clearSubsiteCountryPref(variant);
    return;
  }
  try {
    localStorage.setItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant], country);
    localStorage.setItem(MARKET_SUBSITE_COUNTRY_SAVED_STORAGE[variant], "1");
  } catch {
    /* ignore */
  }
}

/** Client-only: user-saved subsite country (no URL param). Default ALL when never explicitly saved. */
export function readStoredSubsiteCountryPref(
  variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE,
): MarketSubsiteCountryParam {
  if (typeof window === "undefined") return "all";
  if (!hasExplicitSubsiteCountryPref(variant)) return "all";
  try {
    return parseCountryParam(localStorage.getItem(MARKET_SUBSITE_COUNTRY_STORAGE[variant]));
  } catch {
    return "all";
  }
}

/** URL `country` → explicit user save → default ALL. */
export function resolveEffectiveSubsiteCountry(
  searchParams: Pick<URLSearchParams, "get">,
  variant: keyof typeof MARKET_SUBSITE_COUNTRY_STORAGE,
): MarketSubsiteCountryParam {
  const fromUrl = parseCountryParam(searchParams.get("country"));
  if (fromUrl !== "all") return fromUrl;
  return readStoredSubsiteCountryPref(variant);
}

export type MarketSubsiteListingsQueryParams = {
  country: MarketSubsiteCountryParam;
  category: "all" | MerchantCategorySlug | AcquisitionCategorySlug;
  sort: MerchantSortId | AcquisitionSortId;
};

/** `GET …/market/{segment}/listings` query（94 §2.3.5 · 与 UI URL 同键） */
export function buildMarketSubsiteListingsQueryString(
  params: MarketSubsiteListingsQueryParams,
): string {
  const sp = new URLSearchParams();
  if (params.country !== "all") sp.set("country", params.country);
  if (params.category !== "all") sp.set("category", params.category);
  if (params.sort !== "recent") sp.set("sort", params.sort);
  return sp.toString();
}

export function applyMarketSubsiteProviderFilters(
  list: DemoMerchantListing[],
  country: MarketSubsiteCountryParam,
  category: "all" | MerchantCategorySlug,
  sort: MerchantSortId,
): DemoMerchantListing[] {
  return sortMerchantListings(filterMerchantListings(list, country, category), sort);
}

export function applyMarketSubsiteAcquisitionFilters(
  list: DemoAcquisitionListing[],
  country: MarketSubsiteCountryParam,
  category: "all" | AcquisitionCategorySlug,
  sort: AcquisitionSortId,
): DemoAcquisitionListing[] {
  return sortAcquisitionListings(filterAcquisitionListings(list, country, category), sort);
}
