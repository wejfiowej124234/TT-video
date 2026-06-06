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
