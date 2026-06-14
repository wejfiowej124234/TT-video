/**
 * Catalog POI media adapter — published hero + payload merge (S3/W5)
 */
import type { CatalogPoiDetail } from "./catalogPoiAdapter";

export type CatalogPoiImageRow = {
  poi_id: string;
  legacy_value: string | null;
  city_name_zh: string;
  country_iso: string;
  poi_type: string;
  image_url: string;
  image_source: "published" | "payload" | string;
};

export function buildPoiImageByLegacyValueMap(
  rows: CatalogPoiImageRow[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = row.legacy_value?.trim();
    const url = row.image_url?.trim();
    if (key && url) out[key] = url;
  }
  return out;
}

export function applyCatalogPoiImagesToDetails(
  details: CatalogPoiDetail[],
  imageByLegacyValue: Record<string, string>,
): CatalogPoiDetail[] {
  return details.map((d) => {
    const catalogImage = imageByLegacyValue[d.value]?.trim();
    if (!catalogImage) return d;
    return { ...d, image: catalogImage };
  });
}

export function mergeCatalogPoiDetailsWithImages(
  details: CatalogPoiDetail[],
  imageRows: CatalogPoiImageRow[],
): CatalogPoiDetail[] {
  return applyCatalogPoiImagesToDetails(details, buildPoiImageByLegacyValueMap(imageRows));
}
