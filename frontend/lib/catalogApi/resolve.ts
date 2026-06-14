/**
 * Catalog 统一读入口（S2b Phase 3）
 * `NEXT_PUBLIC_CATALOG_API_ENABLED=0` → TS · `=1` → API 优先 · 失败回退 TS
 */
import {
  countryNameZhToIso,
  mapApiCitiesToOptions,
  mapApiCountriesToOptions,
  mapApiCountriesToProductCountries,
  readCitiesFromTs,
  readCountriesFromTs,
  readProductCountriesFromTs,
  type CatalogProductCountryRow,
} from "./catalogGeoAdapter";
import { mapApiHotelTiersToResolved, readHotelTiersFromTs } from "./catalogHotelTierAdapter";
import {
  mapCatalogPricingItemToConfig,
  readPricingFromTs,
} from "./catalogPricingAdapter";
import {
  buildPoiImageByLegacyValueMap,
} from "./catalogPoiMediaAdapter";
import {
  mapApiPoisToDetails,
  readPoiDetailsFromTs,
  type CatalogApiPoiRow,
  type CatalogPoiDetail,
  type CatalogPoiType,
} from "./catalogPoiAdapter";
import { createDefaultCatalogResolveDeps, type CatalogResolveDeps } from "./deps";
import type {
  CatalogCityOption,
  CatalogCountryOption,
  CatalogResolveResult,
  ResolvedCatalogHotelTier,
} from "./types";
import type { CountryPricingConfig } from "../countries/types";

async function resolveWithCatalogFallback<T>(
  deps: CatalogResolveDeps,
  apiLoad: () => Promise<T>,
  tsLoad: () => T,
): Promise<CatalogResolveResult<T>> {
  if (!deps.isEnabled()) {
    return { data: tsLoad(), source: "ts" };
  }
  try {
    const data = await apiLoad();
    return { data, source: "catalog-api" };
  } catch {
    return { data: tsLoad(), source: "ts" };
  }
}

export async function resolveCatalogCountries(
  deps: CatalogResolveDeps = createDefaultCatalogResolveDeps(),
): Promise<CatalogResolveResult<CatalogCountryOption[]>> {
  return resolveWithCatalogFallback(
    deps,
    async () => {
      const res = await deps.api.fetchCountries();
      if (!res.items.length) throw new Error("catalog_api_empty");
      return mapApiCountriesToOptions(res.items);
    },
    readCountriesFromTs,
  );
}

export async function resolveCatalogProductCountries(
  deps: CatalogResolveDeps = createDefaultCatalogResolveDeps(),
): Promise<CatalogResolveResult<CatalogProductCountryRow[]>> {
  return resolveWithCatalogFallback(
    deps,
    async () => {
      const res = await deps.api.fetchCountries();
      if (!res.items.length) throw new Error("catalog_api_empty");
      return mapApiCountriesToProductCountries(res.items);
    },
    readProductCountriesFromTs,
  );
}

export async function resolveCatalogCities(
  countryNameZh: string,
  deps: CatalogResolveDeps = createDefaultCatalogResolveDeps(),
): Promise<CatalogResolveResult<CatalogCityOption[]>> {
  const tsLoad = () => readCitiesFromTs(countryNameZh);
  return resolveWithCatalogFallback(
    deps,
    async () => {
      const iso = countryNameZhToIso(countryNameZh);
      if (!iso) throw new Error("catalog_unknown_country");
      const res = await deps.api.fetchCities(iso);
      if (!res.items.length) throw new Error("catalog_api_empty");
      return mapApiCitiesToOptions(res.items);
    },
    tsLoad,
  );
}

export async function resolveCatalogPoiDetails(
  cityNameZh: string,
  countryNameZh: string,
  type: CatalogPoiType,
  deps: CatalogResolveDeps = createDefaultCatalogResolveDeps(),
): Promise<CatalogResolveResult<CatalogPoiDetail[]>> {
  const tsLoad = () => readPoiDetailsFromTs(cityNameZh, type);
  return resolveWithCatalogFallback(
    deps,
    async () => {
      const iso = countryNameZhToIso(countryNameZh);
      if (!iso) throw new Error("catalog_unknown_country");
      const [poisRes, imagesRes] = await Promise.all([
        deps.api.fetchPois({ countryIso: iso, city: cityNameZh, type }),
        deps.api.fetchPoiImages({ countryIso: iso, city: cityNameZh, type }).catch(() => ({
          status: "ok" as const,
          count: 0,
          items: [],
        })),
      ]);
      const items = poisRes.items as CatalogApiPoiRow[];
      if (!items.length) throw new Error("catalog_api_empty");
      const catalogImagesByLegacy = buildPoiImageByLegacyValueMap(imagesRes.items);
      return mapApiPoisToDetails(items, cityNameZh, type, catalogImagesByLegacy);
    },
    tsLoad,
  );
}

export async function resolveCatalogPricing(
  countryNameZh: string,
  deps: CatalogResolveDeps = createDefaultCatalogResolveDeps(),
): Promise<CatalogResolveResult<CountryPricingConfig>> {
  const tsLoad = () => readPricingFromTs(countryNameZh);
  return resolveWithCatalogFallback(
    deps,
    async () => {
      const iso = countryNameZhToIso(countryNameZh);
      if (!iso) throw new Error("catalog_unknown_country");
      const res = await deps.api.fetchPricing(iso);
      const row = res.items[0];
      if (!row) throw new Error("catalog_api_empty");
      return mapCatalogPricingItemToConfig(row);
    },
    tsLoad,
  );
}

export async function resolveCatalogHotelTiers(
  deps: CatalogResolveDeps = createDefaultCatalogResolveDeps(),
): Promise<CatalogResolveResult<ResolvedCatalogHotelTier[]>> {
  return resolveWithCatalogFallback(
    deps,
    async () => {
      const res = await deps.api.fetchHotelTiers();
      if (!res.items.length) throw new Error("catalog_api_empty");
      return mapApiHotelTiersToResolved(res.items);
    },
    readHotelTiersFromTs,
  );
}
