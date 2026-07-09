/**
 * Catalog API + Adapter 公共出口（S2b · 无 UI 接线）
 */
export {
  fetchCatalogCities,
  fetchCatalogCountries,
  fetchCatalogHotelTiers,
  fetchCatalogIntercityRoutes,
  fetchCatalogMedia,
  fetchCatalogPois,
  fetchCatalogPricing,
  isCatalogApiEnabled,
} from "./client";
export type { CatalogListResponse } from "./client";
export * from "./types";
export {
  mapApiCountriesToOptions,
  mapApiCitiesToOptions,
  mapApiCountriesToProductCountries,
  readCountriesFromTs,
  readCitiesFromTs,
  readProductCountriesFromTs,
  countryNameZhToIso,
} from "./catalogGeoAdapter";
export {
  centsToYuan,
  mapCatalogPricingItemToConfig,
  readPricingFromTs,
} from "./catalogPricingAdapter";
export { mapApiHotelTiersToResolved, readHotelTiersFromTs } from "./catalogHotelTierAdapter";
export {
  readPoiLegacyValuesFromTs,
  mapApiPoisToLegacyValues,
  readPoiDetailsFromTs,
  mapApiPoisToDetails,
  type CatalogPoiType,
  type CatalogApiPoiRow,
  type CatalogPoiDetail,
} from "./catalogPoiAdapter";
export {
  readIntercityModesFromTs,
  mapApiIntercityRoutesToModes,
  type CatalogApiIntercityRouteRow,
} from "./catalogIntercityAdapter";
export {
  runOfflineCustomItineraryCatalogShadowCompare,
  runLiveCustomItineraryCatalogShadowCompare,
  formatCatalogShadowReport,
  buildSyntheticPricingItemFromTs,
  CATALOG_SHADOW_DOMAINS,
  type CatalogShadowCompareReport,
  type CatalogShadowMismatch,
} from "./customItineraryCatalogShadowCompare";
export {
  resolveCatalogCountries,
  resolveCatalogCities,
  resolveCatalogPoiDetails,
  resolveCatalogProductCountries,
  resolveCatalogPricing,
  resolveCatalogHotelTiers,
} from "./resolve";
export {
  resolveLandingAmbientUrl,
  createDefaultLandingAmbientResolveDeps,
  type LandingAmbientResolveDeps,
} from "./resolveLandingAmbient";
export {
  resolveCityHero,
  resolveCityHeroUrl,
  createDefaultCityHeroResolveDeps,
  fallbackKeyForCountryIso,
  type CityHeroResolveDeps,
} from "./resolveCityHero";
export { useLandingAmbientUrl } from "./useLandingAmbientUrl";
export {
  useCatalogCountryOptions,
  useCatalogCityOptions,
  useCatalogProductCountries,
  useGuideRegisterCountryOptions,
} from "./useCatalogGeo";
export { useCatalogPoiDetails } from "./useCatalogPoi";
export { createDefaultCatalogResolveDeps, type CatalogResolveDeps, type CatalogApiClient } from "./deps";
