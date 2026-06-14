/**
 * S2-API-RO · Catalog 只读 HTTP 客户端
 * 默认不接入 UI；`isCatalogApiEnabled()` 为 false 时不应调用。
 */
import type { CatalogPricingItem } from "./types";

export type {
  CatalogPricingItem,
  CatalogCityTransportPriceCents,
  CatalogIntercityPricePerPersonCents,
  CatalogGuideLevelsPerDayCents,
} from "./types";
export {
  CATALOG_PRICING_ITEM_KEYS,
  CATALOG_CITY_TRANSPORT_KEYS,
  CATALOG_INTERCITY_PRICE_KEYS,
  CATALOG_GUIDE_LEVEL_KEYS,
} from "./types";
function catalogApiBaseUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.CATALOG_API_BASE_URL) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
    "http://127.0.0.1:8080";
  return raw.replace(/\/$/, "");
}

export function isCatalogApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CATALOG_API_ENABLED === "1";
}

export interface CatalogListResponse<T> {
  status: "ok";
  count: number;
  items: T[];
}

async function catalogGet<T>(path: string, init?: RequestInit): Promise<CatalogListResponse<T>> {
  const base = catalogApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`catalog GET ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as CatalogListResponse<T>;
}

export function fetchCatalogCountries() {
  return catalogGet<{ iso3166: string; name_zh: string; sort_order: number }>(
    "/api/v1/catalog/countries",
  );
}

export function fetchCatalogCities(countryIso?: string) {
  const q = countryIso ? `?country_iso=${encodeURIComponent(countryIso)}` : "";
  return catalogGet<{ country_iso: string; name_zh: string; slug: string }>(
    `/api/v1/catalog/cities${q}`,
  );
}

export function fetchCatalogPois(opts?: { countryIso?: string; city?: string; type?: string }) {
  const params = new URLSearchParams();
  if (opts?.countryIso) params.set("country_iso", opts.countryIso);
  if (opts?.city) params.set("city", opts.city);
  if (opts?.type) params.set("type", opts.type);
  const q = params.toString();
  return catalogGet<{ poi_type: string; legacy_value: string | null; city_name_zh: string }>(
    `/api/v1/catalog/pois${q ? `?${q}` : ""}`,
  );
}

export function fetchCatalogPoiImages(opts?: { countryIso?: string; city?: string; type?: string }) {
  const params = new URLSearchParams();
  if (opts?.countryIso) params.set("country_iso", opts.countryIso);
  if (opts?.city) params.set("city", opts.city);
  if (opts?.type) params.set("type", opts.type);
  const q = params.toString();
  return catalogGet<{
    poi_id: string;
    legacy_value: string | null;
    city_name_zh: string;
    country_iso: string;
    poi_type: string;
    image_url: string;
    image_source: string;
  }>(`/api/v1/catalog/poi-images${q ? `?${q}` : ""}`);
}

export function fetchCatalogPoiImageById(poiId: string) {
  return catalogGet<{
    poi_id: string;
    legacy_value: string | null;
    image_url: string;
    image_source: string;
  }>(`/api/v1/catalog/poi-images/${encodeURIComponent(poiId)}`);
}

export function fetchCatalogPricing(countryIso?: string) {
  const q = countryIso ? `?country_iso=${encodeURIComponent(countryIso)}` : "";
  return catalogGet<CatalogPricingItem>(`/api/v1/catalog/pricing${q}`);
}

export function fetchCatalogIntercityRoutes(fromCity: string, toCity: string) {
  const params = new URLSearchParams({ from_city: fromCity, to_city: toCity });
  return catalogGet<{ mode: string; from_city_name_zh: string; to_city_name_zh: string }>(
    `/api/v1/catalog/intercity-routes?${params}`,
  );
}

export function fetchCatalogMedia(opts?: { assetKind?: string; countryIso?: string }) {
  const params = new URLSearchParams();
  if (opts?.assetKind) params.set("asset_kind", opts.assetKind);
  if (opts?.countryIso) params.set("country_iso", opts.countryIso);
  const q = params.toString();
  return catalogGet<{ url: string; asset_kind: string; country_iso?: string | null }>(
    `/api/v1/catalog/media${q ? `?${q}` : ""}`,
  );
}

export function fetchCatalogHotelTiers() {
  return catalogGet<{
    tier_code: string;
    sort_order: number;
    multiplier: number;
    label_key: string;
    description_key: string;
    submit_label_zh: string;
    stock_image_url: string | null;
  }>("/api/v1/catalog/hotel-tiers");
}
