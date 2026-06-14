/**
 * Catalog POI adapter — API → Custom Itinerary 展示同形（S2b Phase 6/7）
 */
import type { AttractionDetail, FoodDetail } from "../cityDetails/types";
import { getAttractionDetails, getFoodDetails } from "../cityDetails/index";

export type CatalogPoiType = "attraction" | "food";

export type CatalogPoiDetail = AttractionDetail | FoodDetail;

export type CatalogApiPoiRow = {
  poi_type: string;
  legacy_value: string | null;
  city_name_zh: string;
  name_zh?: string;
  description_zh?: string | null;
  sort_order?: number;
  payload?: Record<string, unknown> | null;
};

function poiImageFromPayload(payload: Record<string, unknown> | null | undefined): string {
  if (!payload || typeof payload !== "object") return "";
  const url = payload.image_url ?? payload.image;
  return typeof url === "string" ? url : "";
}

export function readPoiDetailsFromTs(cityNameZh: string, type: CatalogPoiType): CatalogPoiDetail[] {
  return type === "attraction" ? getAttractionDetails(cityNameZh) : getFoodDetails(cityNameZh);
}

export function readPoiLegacyValuesFromTs(cityNameZh: string, type: CatalogPoiType): string[] {
  return readPoiDetailsFromTs(cityNameZh, type)
    .map((d) => d.value)
    .sort((a, b) => a.localeCompare(b, "zh"));
}

export function mapApiPoisToLegacyValues(items: CatalogApiPoiRow[]): string[] {
  return items
    .map((r) => r.legacy_value)
    .filter((v): v is string => Boolean(v?.trim()))
    .sort((a, b) => a.localeCompare(b, "zh"));
}

export function mapApiPoisToDetails(
  items: CatalogApiPoiRow[],
  cityNameZh: string,
  type: CatalogPoiType,
  catalogImagesByLegacy?: Record<string, string>,
): CatalogPoiDetail[] {
  const tsByValue = Object.fromEntries(
    readPoiDetailsFromTs(cityNameZh, type).map((d) => [d.value, d]),
  ) as Record<string, CatalogPoiDetail>;

  return [...items]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name_zh ?? "").localeCompare(b.name_zh ?? "", "zh"))
    .map((row) => {
      const value = (row.legacy_value ?? row.name_zh ?? "").trim();
      if (!value) return null;
      const ts = tsByValue[value];
      const catalogImage = catalogImagesByLegacy?.[value]?.trim();
      const apiImage = catalogImage || poiImageFromPayload(row.payload ?? undefined);
      return {
        value,
        label: row.name_zh?.trim() || ts?.label || value,
        image: apiImage || ts?.image || "",
        description: row.description_zh?.trim() || ts?.description || "",
      };
    })
    .filter((d): d is CatalogPoiDetail => d != null);
}
