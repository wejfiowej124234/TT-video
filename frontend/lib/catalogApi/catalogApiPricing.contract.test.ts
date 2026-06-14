/**
 * Catalog pricing API 形状 contract（S2b Phase 2 · 无 HTTP）
 * 与 `CountryPricingConfig` / import cents 键对齐，供 adapter 预备。
 */
import { describe, expect, it } from "vitest";
import type { CountryPricingConfig } from "../countries/types";
import {
  CATALOG_CITY_TRANSPORT_KEYS,
  CATALOG_GUIDE_LEVEL_KEYS,
  CATALOG_INTERCITY_PRICE_KEYS,
  CATALOG_PRICING_ITEM_KEYS,
} from "./types";

describe("catalog pricing API contract (static)", () => {
  it("CATALOG_PRICING_ITEM_KEYS covers CountryPricingConfig + catalog metadata", () => {
    const pricingConfigKeys: (keyof CountryPricingConfig)[] = [
      "cityTransportPrice",
      "intercityPricePerPerson",
      "perAttraction",
      "perFood",
      "hotelPerNightPerPerson",
      "guideLevelsSuggestedPerDay",
    ];
    expect(CATALOG_PRICING_ITEM_KEYS).toContain("city_transport_price");
    expect(CATALOG_PRICING_ITEM_KEYS).toContain("intercity_price_per_person");
    expect(CATALOG_PRICING_ITEM_KEYS).toContain("guide_levels_per_day");
    expect(CATALOG_PRICING_ITEM_KEYS).toContain("per_attraction_cents");
    expect(CATALOG_PRICING_ITEM_KEYS).toContain("per_food_cents");
    expect(CATALOG_PRICING_ITEM_KEYS).toContain("hotel_base_per_night_cents");
    expect(pricingConfigKeys.length).toBe(6);
  });

  it("nested JSON keys match TS cityTransport / intercity / guideLevels", () => {
    expect([...CATALOG_CITY_TRANSPORT_KEYS]).toEqual(["sedan", "suv", "van"]);
    expect([...CATALOG_INTERCITY_PRICE_KEYS]).toEqual(["flight", "rail"]);
    expect([...CATALOG_GUIDE_LEVEL_KEYS]).toEqual([
      "primary",
      "intermediate",
      "advanced",
      "expert",
    ]);
  });
});
