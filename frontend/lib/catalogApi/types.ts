/**
 * Catalog API 只读响应类型（S2-API-RO / S2b Phase 2）
 * 嵌套 JSON 金额为 minor units（cents），与 import / PG 同源。
 */

/** 市内用车每日单价（cents） */
export type CatalogCityTransportPriceCents = {
  sedan: number;
  suv: number;
  van: number;
};

/** 城际交通每人单价（cents） */
export type CatalogIntercityPricePerPersonCents = {
  flight: number;
  rail: number;
};

/** 向导等级建议日薪（cents） */
export type CatalogGuideLevelsPerDayCents = {
  primary: number;
  intermediate: number;
  advanced: number;
  expert: number;
};

/** `GET /api/v1/catalog/pricing` 行投影 — 对齐 `catalog_pricing_templates` published */
export interface CatalogPricingItem {
  id: string;
  country_id: string;
  country_iso: string;
  country_name_zh: string;
  currency_code: string;
  per_attraction_cents: number;
  per_food_cents: number;
  hotel_base_per_night_cents: number;
  city_transport_price: CatalogCityTransportPriceCents;
  intercity_price_per_person: CatalogIntercityPricePerPersonCents;
  guide_levels_per_day: CatalogGuideLevelsPerDayCents;
  version: number;
}

/** 机读 contract：pricing 行顶层键（adapter 对拍用） */
export const CATALOG_PRICING_ITEM_KEYS = [
  "id",
  "country_id",
  "country_iso",
  "country_name_zh",
  "currency_code",
  "per_attraction_cents",
  "per_food_cents",
  "hotel_base_per_night_cents",
  "city_transport_price",
  "intercity_price_per_person",
  "guide_levels_per_day",
  "version",
] as const;

export const CATALOG_CITY_TRANSPORT_KEYS = ["sedan", "suv", "van"] as const;

export const CATALOG_INTERCITY_PRICE_KEYS = ["flight", "rail"] as const;

export const CATALOG_GUIDE_LEVEL_KEYS = [
  "primary",
  "intermediate",
  "advanced",
  "expert",
] as const;

/** Adapter 读源标记（S2b Phase 3） */
export type CatalogResolveSource = "ts" | "catalog-api";

export interface CatalogResolveResult<T> {
  data: T;
  source: CatalogResolveSource;
}

/** 与 `geoOptions.COUNTRY_OPTIONS` 同形 */
export type CatalogCountryOption = { value: string; label: string };

/** 与 `CITIES_BY_COUNTRY[*]` 元素同形 */
export type CatalogCityOption = { value: string; label: string };

/** 与 `HOTEL_TIERS` + multiplier/submit 对齐的 adapter 输出 */
export type ResolvedCatalogHotelTier = {
  value: string;
  labelKey: string;
  descriptionKey: string;
  image: string;
  submitLabelZh: string;
  multiplier: number;
};

export type CatalogApiCountryRow = {
  iso3166: string;
  name_zh: string;
  sort_order: number;
};

export type CatalogApiCityRow = {
  country_iso: string;
  name_zh: string;
  slug: string;
};

export type CatalogApiHotelTierRow = {
  tier_code: string;
  sort_order: number;
  multiplier: number;
  label_key: string;
  description_key: string;
  submit_label_zh: string;
  stock_image_url: string | null;
};
