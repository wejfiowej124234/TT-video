/**
 * Catalog resolve 依赖注入（S2b Phase 3 · 测试 mock 用）
 */
import {
  fetchCatalogCities,
  fetchCatalogCountries,
  fetchCatalogHotelTiers,
  fetchCatalogPoiImages,
  fetchCatalogPois,
  fetchCatalogPricing,
  isCatalogApiEnabled,
} from "./client";

export type CatalogApiClient = {
  fetchCountries: typeof fetchCatalogCountries;
  fetchCities: typeof fetchCatalogCities;
  fetchPricing: typeof fetchCatalogPricing;
  fetchHotelTiers: typeof fetchCatalogHotelTiers;
  fetchPois: typeof fetchCatalogPois;
  fetchPoiImages: typeof fetchCatalogPoiImages;
};

export type CatalogResolveDeps = {
  isEnabled: () => boolean;
  api: CatalogApiClient;
};

export function createDefaultCatalogResolveDeps(): CatalogResolveDeps {
  return {
    isEnabled: isCatalogApiEnabled,
    api: {
      fetchCountries: fetchCatalogCountries,
      fetchCities: fetchCatalogCities,
      fetchPricing: fetchCatalogPricing,
      fetchHotelTiers: fetchCatalogHotelTiers,
      fetchPois: fetchCatalogPois,
      fetchPoiImages: fetchCatalogPoiImages,
    },
  };
}
