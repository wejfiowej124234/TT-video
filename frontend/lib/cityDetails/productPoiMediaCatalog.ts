import { CITY_TO_REGION } from "./constants";
import { poiStockUrl, type PoiStockKey } from "./poiStockPool";
import {
  ATTRACTION_CITY_OVERRIDES,
  ATTRACTION_SEMANTIC,
  FOOD_SEMANTIC,
} from "./poiSemanticMaps";
import { FOOD_DESCRIPTION_BY_VALUE } from "./poiFoodDescriptions";
import { buildPoiImageId } from "./poiImageVerification/poiImageId";
import { resolveWhitelistedPoiImage } from "./poiImageVerification/resolveVerifiedPoiImage";

export function poiKey(city: string, value: string): string {
  return `${city}::${value}`;
}

export function resolveCatalogAttractionImage(city: string, value: string, fallback: string): string {
  const country = CITY_TO_REGION[city] ?? "";
  const poiId = buildPoiImageId({ country, city, kind: "attraction", value });
  const whitelisted = resolveWhitelistedPoiImage(poiId);
  if (whitelisted) return whitelisted;

  const key = poiKey(city, value);
  const stockKey: PoiStockKey | undefined =
    ATTRACTION_CITY_OVERRIDES[key] ?? ATTRACTION_SEMANTIC[value];
  return stockKey ? poiStockUrl(stockKey) : fallback;
}

export function resolveCatalogFoodImage(city: string, value: string, fallback: string): string {
  const country = CITY_TO_REGION[city] ?? "";
  const poiId = buildPoiImageId({ country, city, kind: "food", value });
  const whitelisted = resolveWhitelistedPoiImage(poiId);
  if (whitelisted) return whitelisted;

  const stockKey = FOOD_SEMANTIC[value];
  return stockKey ? poiStockUrl(stockKey) : fallback;
}

export function resolveCatalogFoodDescription(
  city: string,
  value: string,
  label: string,
  fallback: string
): string {
  const tpl = FOOD_DESCRIPTION_BY_VALUE[value];
  if (!tpl) return fallback;
  return tpl.replace(/\{city\}/g, city).replace(/\{label\}/g, label);
}

/** 收集十国产品期全部配图 URL（测试与健康检查） */
export function collectAllProductPoiImageUrls(): string[] {
  const urls = new Set<string>();
  for (const key of Object.values(ATTRACTION_CITY_OVERRIDES)) urls.add(poiStockUrl(key));
  for (const key of Object.values(ATTRACTION_SEMANTIC)) urls.add(poiStockUrl(key));
  for (const key of Object.values(FOOD_SEMANTIC)) urls.add(poiStockUrl(key));
  return [...urls];
}
