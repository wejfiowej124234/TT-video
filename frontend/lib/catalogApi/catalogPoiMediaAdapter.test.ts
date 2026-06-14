/**
 * Catalog POI media adapter · W5 merge priority
 */
import { describe, expect, it } from "vitest";
import { getAttractionDetails } from "../cityDetails/index";
import { mapApiPoisToDetails, type CatalogApiPoiRow } from "./catalogPoiAdapter";
import {
  applyCatalogPoiImagesToDetails,
  buildPoiImageByLegacyValueMap,
  mergeCatalogPoiDetailsWithImages,
} from "./catalogPoiMediaAdapter";

describe("catalogPoiMediaAdapter", () => {
  it("buildPoiImageByLegacyValueMap keys by legacy_value", () => {
    const map = buildPoiImageByLegacyValueMap([
      {
        poi_id: "1",
        legacy_value: "故宫",
        city_name_zh: "北京",
        country_iso: "CN",
        poi_type: "attraction",
        image_url: "https://cdn.example.com/a.jpg",
        image_source: "published",
      },
    ]);
    expect(map["故宫"]).toBe("https://cdn.example.com/a.jpg");
  });

  it("published catalog image overrides TS image on details", () => {
    const ts = getAttractionDetails("北京");
    const catalogUrl = "https://cdn.example.com/catalog-only.jpg";
    const merged = applyCatalogPoiImagesToDetails(ts, { 故宫: catalogUrl });
    expect(merged.find((d) => d.value === "故宫")?.image).toBe(catalogUrl);
    expect(merged.find((d) => d.value === "长城")?.image).toBe(
      ts.find((d) => d.value === "长城")?.image,
    );
  });

  it("mergeCatalogPoiDetailsWithImages applies mapApiPois + image rows", () => {
    const rows: CatalogApiPoiRow[] = [
      {
        poi_type: "attraction",
        legacy_value: "故宫",
        city_name_zh: "北京",
        name_zh: "故宫",
        description_zh: "desc",
        sort_order: 0,
        payload: { image_url: "https://payload.example/p.jpg" },
      },
    ];
    const details = mapApiPoisToDetails(rows, "北京", "attraction");
    const merged = mergeCatalogPoiDetailsWithImages(details, [
      {
        poi_id: "x",
        legacy_value: "故宫",
        city_name_zh: "北京",
        country_iso: "CN",
        poi_type: "attraction",
        image_url: "https://published.example/hero.jpg",
        image_source: "published",
      },
    ]);
    expect(merged[0]?.image).toBe("https://published.example/hero.jpg");
  });
});
