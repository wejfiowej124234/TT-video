/**
 * `/market` 高级筛选 ↔ `GET /api/v1/guides` / `POST /guides` 数据链 SSOT。
 * Canonical 映射真源：`registry/market-guide-facet.v1.json`（Rust 对拍见 `market_guide_filter.rs` 测试）。
 */

import facetRegistry from "../registry/market-guide-facet.v1.json";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";

type FacetEntry = { canonical: string; match: readonly string[] };

const LANGUAGE_REGISTRY = facetRegistry.languages as Record<string, FacetEntry>;
const SERVICE_REGISTRY = facetRegistry.services as Record<string, FacetEntry>;

/** UI 语言 pill → 可匹配的 API / 库内 token 集合（由 registry 派生） */
export const MARKET_UI_LANGUAGE_MATCH_TOKENS: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(LANGUAGE_REGISTRY).map(([ui, row]) => [ui, row.match]),
);

/** UI 服务 pill → 可匹配的 API slug 集合（由 registry 派生） */
export const MARKET_UI_SERVICE_MATCH_SLUGS: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(SERVICE_REGISTRY).map(([ui, row]) => [ui, row.match]),
);

const LANGUAGE_ALIAS_TO_PRIMARY: Record<string, string> = {};
for (const row of Object.values(LANGUAGE_REGISTRY)) {
  for (const tok of row.match) {
    LANGUAGE_ALIAS_TO_PRIMARY[normalizeToken(tok)] = row.canonical;
  }
}

const SERVICE_ALIAS_TO_PRIMARY: Record<string, string> = {};
for (const row of Object.values(SERVICE_REGISTRY)) {
  for (const slug of row.match) {
    SERVICE_ALIAS_TO_PRIMARY[normalizeToken(slug)] = row.canonical;
  }
}

export function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function expandLanguageTokens(uiOrApi: string): string[] {
  const key = uiOrApi.trim();
  const mapped = MARKET_UI_LANGUAGE_MATCH_TOKENS[key];
  if (mapped) return [...mapped];
  const norm = normalizeToken(key);
  const primary = LANGUAGE_ALIAS_TO_PRIMARY[norm];
  if (primary) {
    const uiKey = Object.values(LANGUAGE_REGISTRY).find((r) => r.canonical === primary);
    if (uiKey) return [...uiKey.match];
  }
  return [key];
}

function expandServiceSlugs(uiOrApi: string): string[] {
  const key = uiOrApi.trim();
  const mapped = MARKET_UI_SERVICE_MATCH_SLUGS[key];
  if (mapped) return [...mapped];
  const norm = normalizeToken(key);
  const primary = SERVICE_ALIAS_TO_PRIMARY[norm];
  if (primary) {
    const uiKey = Object.values(SERVICE_REGISTRY).find((r) => r.canonical === primary);
    if (uiKey) return [...uiKey.match];
  }
  return [key];
}

/** 写入 `POST /guides`：单值 canonical slug/code（去重保序） */
export function normalizeGuideLanguageForWrite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  for (const row of Object.values(LANGUAGE_REGISTRY)) {
    if (row.match.some((t) => marketGuideLanguageTokensMatch(trimmed, t))) {
      return row.canonical;
    }
  }
  return normalizeToken(trimmed);
}

export function normalizeGuideServiceTypeForWrite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  for (const row of Object.values(SERVICE_REGISTRY)) {
    if (row.match.some((s) => marketGuideServiceTokensMatch(trimmed, s))) {
      return row.canonical;
    }
  }
  return normalizeToken(trimmed);
}

export function normalizeGuideLanguagesForWrite(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const canon = normalizeGuideLanguageForWrite(v);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    out.push(canon);
  }
  return out;
}

export function normalizeGuideServiceTypesForWrite(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const canon = normalizeGuideServiceTypeForWrite(v);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    out.push(canon);
  }
  return out;
}

export function marketGuideLanguageTokensMatch(a: string, b: string): boolean {
  const setA = new Set(expandLanguageTokens(a).map(normalizeToken));
  const setB = new Set(expandLanguageTokens(b).map(normalizeToken));
  for (const x of setA) {
    if (setB.has(x)) return true;
  }
  const canonA = LANGUAGE_ALIAS_TO_PRIMARY[normalizeToken(a)];
  const canonB = LANGUAGE_ALIAS_TO_PRIMARY[normalizeToken(b)];
  return Boolean(canonA && canonB && canonA === canonB);
}

export function marketGuideServiceTokensMatch(a: string, b: string): boolean {
  const setA = new Set(expandServiceSlugs(a).map(normalizeToken));
  const setB = new Set(expandServiceSlugs(b).map(normalizeToken));
  for (const x of setA) {
    if (setB.has(x)) return true;
  }
  const canonA = SERVICE_ALIAS_TO_PRIMARY[normalizeToken(a)];
  const canonB = SERVICE_ALIAS_TO_PRIMARY[normalizeToken(b)];
  return Boolean(canonA && canonB && canonA === canonB);
}

export function mapUiLanguageToPrimaryApiCode(uiLang: string): string {
  return normalizeGuideLanguageForWrite(uiLang);
}

export function mapUiServiceToPrimaryApiSlug(uiService: string): string {
  return normalizeGuideServiceTypeForWrite(uiService);
}

export type MarketGuideListFilters = {
  country: string;
  city: string;
  languages: readonly string[];
  serviceTypes: readonly string[];
};

export type MarketGuideListApiParams = {
  city?: string;
  language?: string;
  service_type?: string;
  country_code?: string;
  limit?: number;
  cursor?: string;
};

export function marketGuideListNeedsClientOnlyFilters(_filters: MarketGuideListFilters): boolean {
  return false;
}

export function buildMarketGuideListApiParams(filters: MarketGuideListFilters): MarketGuideListApiParams {
  const cityVal = filters.city.trim();
  const countryVal = filters.country.trim();
  const languageVals = filters.languages.map((l) => l.trim()).filter(Boolean);
  const serviceVals = filters.serviceTypes.map((s) => s.trim()).filter(Boolean);

  const out: MarketGuideListApiParams = {};
  if (cityVal) out.city = cityVal;
  if (countryVal && !cityVal) {
    const iso = countryZhToIso(countryVal);
    if (iso) out.country_code = iso;
  }
  if (languageVals.length === 1) out.language = mapUiLanguageToPrimaryApiCode(languageVals[0]!);
  else if (languageVals.length > 1) {
    out.language = languageVals.map((l) => mapUiLanguageToPrimaryApiCode(l)).join(",");
  }
  if (serviceVals.length === 1) out.service_type = mapUiServiceToPrimaryApiSlug(serviceVals[0]!);
  else if (serviceVals.length > 1) {
    out.service_type = serviceVals.map((s) => mapUiServiceToPrimaryApiSlug(s)).join(",");
  }
  return out;
}

function countryZhToIso(countryZh: string): string | null {
  const row = PRODUCT_COUNTRIES.find((c) => c.nameZh === countryZh.trim());
  return row?.iso ?? null;
}

function matchGuideGeo(
  guide: { city?: string | null; country_code?: string | null },
  country: string,
  city: string,
): boolean {
  const countryVal = country.trim();
  const cityVal = city.trim();
  if (!countryVal && !cityVal) return true;

  const gCity = (guide.city ?? "").trim();
  const gIso = (guide.country_code ?? "").trim().toUpperCase();

  if (cityVal) return gCity === cityVal;

  if (countryVal) {
    const iso = countryZhToIso(countryVal);
    if (iso && gIso && gIso === iso) return true;
    const citiesInCountry = CITIES_BY_COUNTRY[countryVal]?.map((c) => c.value) ?? [];
    if (citiesInCountry.length === 0) return true;
    return Boolean(gCity && citiesInCountry.includes(gCity));
  }

  return true;
}

export type MarketGuideFilterRow = {
  city?: string | null;
  country_code?: string | null;
  languages?: string[] | null;
  service_types?: string[] | null;
};

export function guideMatchesMarketAdvancedFilters(
  guide: MarketGuideFilterRow,
  filters: MarketGuideListFilters,
): boolean {
  const languageVals = filters.languages.map((l) => l.trim()).filter(Boolean);
  const serviceVals = filters.serviceTypes.map((s) => s.trim()).filter(Boolean);
  const hasGeo = Boolean(filters.country.trim() || filters.city.trim());
  const hasLang = languageVals.length > 0;
  const hasSvc = serviceVals.length > 0;
  if (!hasGeo && !hasLang && !hasSvc) return true;

  if (!matchGuideGeo(guide, filters.country, filters.city)) return false;

  if (hasLang) {
    const guideLangs = Array.isArray(guide.languages) ? guide.languages : [];
    const langOk = languageVals.some((uiLang) =>
      guideLangs.some((gl) => marketGuideLanguageTokensMatch(uiLang, gl)),
    );
    if (!langOk) return false;
  }

  if (hasSvc) {
    const guideSvcs = Array.isArray(guide.service_types) ? guide.service_types : [];
    const svcOk = serviceVals.some((uiSvc) =>
      guideSvcs.some((gs) => marketGuideServiceTokensMatch(uiSvc, gs)),
    );
    if (!svcOk) return false;
  }

  return true;
}

export function hasMarketGuideFacetFilters(
  filters: Pick<MarketGuideListFilters, "languages" | "serviceTypes">,
): boolean {
  return filters.languages.some((l) => l.trim()) || filters.serviceTypes.some((s) => s.trim());
}

export function hasMarketGuideListFilters(filters: MarketGuideListFilters): boolean {
  return Boolean(
    filters.country.trim() ||
      filters.city.trim() ||
      filters.languages.some((l) => l.trim()) ||
      filters.serviceTypes.some((s) => s.trim()),
  );
}

/** Registry 版本（契约 / 对拍） */
export const MARKET_GUIDE_FACET_REGISTRY_VERSION = facetRegistry.version;
