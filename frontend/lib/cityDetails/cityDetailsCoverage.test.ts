import { describe, expect, it } from "vitest";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import { getAttractionDetails, getFoodDetails, getHotels } from "./index";

describe("cityDetails coverage (十国)", () => {
  for (const { nameZh } of PRODUCT_COUNTRIES) {
    it(`${nameZh} 各城市均有景区、美食与酒店档次`, () => {
      const cities = CITIES_BY_COUNTRY[nameZh] ?? [];
      expect(cities.length, `${nameZh} 无城市配置`).toBeGreaterThan(0);
      for (const { value: city } of cities) {
        expect(getAttractionDetails(city).length, `${nameZh}/${city} 景区`).toBeGreaterThan(0);
        expect(getFoodDetails(city).length, `${nameZh}/${city} 美食`).toBeGreaterThan(0);
        expect(getHotels(city).length, `${nameZh}/${city} 酒店`).toBe(3);
      }
    });
  }
});
