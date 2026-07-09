/**
 * City Hero 读路径（Wave 1 · WP4）
 * `ENABLED=1` → city_hero(city_slug) → landing_ambient(country) → TS
 */
import { landingAmbientImageUrl } from "../landingAmbientByCountry";
import { fetchCatalogMedia, isCatalogApiEnabled } from "./client";
import type { CityHeroResolveInput, CityHeroResolveResult } from "./types";

/** Brief country_slug_map → fallback_key hero_{slug} */
const FALLBACK_KEY_BY_ISO: Record<string, string> = {
  JP: "hero_japan",
  KR: "hero_korea",
  TH: "hero_thailand",
  SG: "hero_singapore",
  FR: "hero_france",
  US: "hero_usa",
  AU: "hero_australia",
  ES: "hero_spain",
  AE: "hero_uae",
  CN: "hero_china",
};

export type CityHeroResolveDeps = {
  isEnabled: () => boolean;
  fetchMedia: typeof fetchCatalogMedia;
};

export function createDefaultCityHeroResolveDeps(): CityHeroResolveDeps {
  return {
    isEnabled: isCatalogApiEnabled,
    fetchMedia: fetchCatalogMedia,
  };
}

export function fallbackKeyForCountryIso(countryIso: string): string | undefined {
  return FALLBACK_KEY_BY_ISO[countryIso.trim().toUpperCase()];
}

function tsUrlForInput(input: CityHeroResolveInput): string {
  const zh = input.countryZh?.trim();
  return landingAmbientImageUrl(zh || "");
}

function pickMediaUrl(
  items: Array<{ url?: string | null; asset_key?: string | null; stock_pool_key?: string | null }>,
): { url: string; asset_key: string | null } | null {
  for (const item of items) {
    const url = item.url?.trim();
    if (!url) continue;
    const asset_key = item.asset_key?.trim() || item.stock_pool_key?.trim() || null;
    return { url, asset_key };
  }
  return null;
}

export async function resolveCityHero(
  input: CityHeroResolveInput,
  deps: CityHeroResolveDeps = createDefaultCityHeroResolveDeps(),
): Promise<CityHeroResolveResult> {
  const tsUrl = tsUrlForInput(input);
  const countryIso = input.countryIso?.trim().toUpperCase();
  const citySlug = input.citySlug?.trim().toLowerCase();
  const fallbackKey = input.fallbackKey?.trim() || (countryIso ? fallbackKeyForCountryIso(countryIso) : undefined);

  if (!deps.isEnabled() || !countryIso || !citySlug) {
    return { data: tsUrl, source: "ts", fallback_used: false, asset_key: null, fallback_key: fallbackKey ?? null };
  }

  let cityHit: { url: string; asset_key: string | null } | null = null;
  try {
    const cityRes = await deps.fetchMedia({
      assetKind: "city_hero",
      countryIso,
      citySlug,
    });
    cityHit = pickMediaUrl(cityRes.items || []);
  } catch {
    /* step 2 */
  }
  if (cityHit) {
    return {
      data: cityHit.url,
      source: "catalog-api",
      asset_key: cityHit.asset_key ?? `city_hero_${citySlug}`,
      fallback_key: fallbackKey ?? null,
      fallback_used: false,
    };
  }

  try {
    const ambientRes = await deps.fetchMedia({
      assetKind: "landing_ambient",
      countryIso,
    });
    const ambientHit = pickMediaUrl(ambientRes.items || []);
    if (ambientHit) {
      return {
        data: ambientHit.url,
        source: "catalog-api-fallback",
        asset_key: null,
        fallback_key: fallbackKey ?? null,
        fallback_used: true,
      };
    }
  } catch {
    /* TS */
  }

  return { data: tsUrl, source: "ts", fallback_used: false, asset_key: null, fallback_key: fallbackKey ?? null };
}

/** @deprecated 别名 · Consumer WP5 可用 */
export const resolveCityHeroUrl = resolveCityHero;
