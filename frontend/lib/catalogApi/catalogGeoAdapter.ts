/**
 * Catalog geo adapter — API 行 → geoOptions 同形（S2b Phase 3）
 */
import { CITIES_BY_COUNTRY, COUNTRY_OPTIONS } from "../geoOptions";
import { PRODUCT_COUNTRIES, type ProductCountryIso } from "../productCountries";
import type {
  CatalogApiCityRow,
  CatalogApiCountryRow,
  CatalogCityOption,
  CatalogCountryOption,
} from "./types";

export type CatalogProductCountryRow = {
  iso: ProductCountryIso;
  nameZh: string;
  guideRegisterLabelKey: (typeof PRODUCT_COUNTRIES)[number]["guideRegisterLabelKey"];
};

export function mapApiCountriesToOptions(items: CatalogApiCountryRow[]): CatalogCountryOption[] {
  return [...items]
    .sort((a, b) => a.sort_order - b.sort_order || a.name_zh.localeCompare(b.name_zh, "zh"))
    .map((c) => ({ value: c.name_zh, label: c.name_zh }));
}

export function mapApiCitiesToOptions(items: CatalogApiCityRow[]): CatalogCityOption[] {
  return items.map((c) => ({ value: c.name_zh, label: c.name_zh }));
}

export function readCountriesFromTs(): CatalogCountryOption[] {
  return COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: c.label }));
}

export function readCitiesFromTs(countryNameZh: string): CatalogCityOption[] {
  return (CITIES_BY_COUNTRY[countryNameZh] ?? []).map((c) => ({
    value: c.value,
    label: c.label,
  }));
}

export function countryNameZhToIso(countryNameZh: string): string | undefined {
  return PRODUCT_COUNTRIES.find((c) => c.nameZh === countryNameZh)?.iso;
}

export function readProductCountriesFromTs(): CatalogProductCountryRow[] {
  return PRODUCT_COUNTRIES.map((c) => ({
    iso: c.iso,
    nameZh: c.nameZh,
    guideRegisterLabelKey: c.guideRegisterLabelKey,
  }));
}

export function mapApiCountriesToProductCountries(
  items: CatalogApiCountryRow[],
): CatalogProductCountryRow[] {
  const tsByIso = Object.fromEntries(PRODUCT_COUNTRIES.map((c) => [c.iso, c])) as Record<
    string,
    (typeof PRODUCT_COUNTRIES)[number]
  >;
  return [...items]
    .sort((a, b) => a.sort_order - b.sort_order || a.name_zh.localeCompare(b.name_zh, "zh"))
    .map((row) => {
      const ts = tsByIso[row.iso3166];
      if (!ts) return null;
      return {
        iso: ts.iso,
        nameZh: row.name_zh,
        guideRegisterLabelKey: ts.guideRegisterLabelKey,
      };
    })
    .filter((row): row is CatalogProductCountryRow => row != null);
}
