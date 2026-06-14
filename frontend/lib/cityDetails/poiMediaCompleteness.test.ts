import { describe, expect, it } from "vitest";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { getAttractionDetails, getFoodDetails } from "./index";
import { ATTRACTION_SEMANTIC, FOOD_SEMANTIC } from "./poiSemanticMaps";
import { FOOD_DESCRIPTION_BY_VALUE } from "./poiFoodDescriptions";
import { BANNED_STOCK_IMAGE_FRAGMENTS } from "./itineraryStockImages";
import { poiKey } from "./productPoiMediaCatalog";

const GENERIC_FOOD_DESC = "当地特色美食，推荐品尝";

describe("poiMediaCompleteness (十国)", () => {
  it("全部景区 value 有语义配图映射", () => {
    const missing: string[] = [];
    for (const { nameZh } of PRODUCT_COUNTRIES) {
      for (const { value: city } of CITIES_BY_COUNTRY[nameZh] ?? []) {
        for (const a of getAttractionDetails(city)) {
          if (!ATTRACTION_SEMANTIC[a.value]) missing.push(`${city}::${a.value}`);
        }
      }
    }
    expect(missing, missing.join(", ")).toEqual([]);
  });

  it("全部美食 value 有语义配图与专属描述", () => {
    const missingImg: string[] = [];
    const missingDesc: string[] = [];
    for (const { nameZh } of PRODUCT_COUNTRIES) {
      for (const { value: city } of CITIES_BY_COUNTRY[nameZh] ?? []) {
        for (const f of getFoodDetails(city)) {
          if (!FOOD_SEMANTIC[f.value]) missingImg.push(`${city}::${f.value}`);
          if (!FOOD_DESCRIPTION_BY_VALUE[f.value]) missingDesc.push(f.value);
          expect(f.description).not.toContain(GENERIC_FOOD_DESC);
          for (const banned of BANNED_STOCK_IMAGE_FRAGMENTS) {
            expect(f.image, `${poiKey(city, f.value)}`).not.toContain(banned);
          }
        }
      }
    }
    expect(missingImg, missingImg.join(", ")).toEqual([]);
    expect(missingDesc, missingDesc.join(", ")).toEqual([]);
  });

  it("全部景区配图不含禁用图", () => {
    for (const { nameZh } of PRODUCT_COUNTRIES) {
      for (const { value: city } of CITIES_BY_COUNTRY[nameZh] ?? []) {
        for (const a of getAttractionDetails(city)) {
          for (const banned of BANNED_STOCK_IMAGE_FRAGMENTS) {
            expect(a.image, poiKey(city, a.value)).not.toContain(banned);
          }
        }
      }
    }
  });
});
