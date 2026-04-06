/**
 * 44 阶段 §9.1：getPricingForCountry 单测 + geoOptions ↔ countries 一致性校验
 */
import { describe, it, expect } from "vitest";
import { getPricingForCountry, getPricingCountryKeys, pricingCN } from "./index";
import { COUNTRY_OPTIONS, CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import type { CountryPricingConfig } from "./types";

const REQUIRED_TOP_KEYS: (keyof CountryPricingConfig)[] = [
  "cityTransportPrice",
  "intercityPricePerPerson",
  "perAttraction",
  "perFood",
  "hotelPerNightPerPerson",
  "guideLevelsSuggestedPerDay",
];

function assertValidConfig(config: CountryPricingConfig) {
  for (const key of REQUIRED_TOP_KEYS) {
    expect(config).toHaveProperty(key);
  }
  expect(config.cityTransportPrice).toHaveProperty("sedan");
  expect(config.cityTransportPrice).toHaveProperty("suv");
  expect(config.cityTransportPrice).toHaveProperty("van");
  expect(config.intercityPricePerPerson).toHaveProperty("flight");
  expect(config.intercityPricePerPerson).toHaveProperty("rail");
  expect(config.guideLevelsSuggestedPerDay).toHaveProperty("primary");
  expect(config.guideLevelsSuggestedPerDay).toHaveProperty("expert");
  expect(typeof config.perAttraction).toBe("number");
  expect(typeof config.perFood).toBe("number");
  expect(typeof config.hotelPerNightPerPerson).toBe("number");
  expect(config.perAttraction).toBeGreaterThanOrEqual(0);
  expect(config.perFood).toBeGreaterThanOrEqual(0);
  expect(config.hotelPerNightPerPerson).toBeGreaterThanOrEqual(0);
}

describe("lib/countries getPricingForCountry", () => {
  it("returns config for known country (中国)", () => {
    const config = getPricingForCountry("中国");
    expect(config).toBe(pricingCN);
    assertValidConfig(config);
  });

  it("returns config for known country (日本)", () => {
    const config = getPricingForCountry("日本");
    expect(config).not.toBe(pricingCN);
    assertValidConfig(config);
  });

  it("returns default (中国) config for unknown country", () => {
    const config = getPricingForCountry("未知国");
    expect(config).toBe(pricingCN);
    assertValidConfig(config);
  });

  it("returns default (中国) config for empty string", () => {
    const config = getPricingForCountry("");
    expect(config).toBe(pricingCN);
  });

  it("returns default (中国) config for whitespace-only", () => {
    const config = getPricingForCountry("   ");
    expect(config).toBe(pricingCN);
  });

  it("returned config has all required fields and numeric sub-fields", () => {
    const config = getPricingForCountry("泰国");
    assertValidConfig(config);
    expect(typeof config.cityTransportPrice.sedan).toBe("number");
    expect(typeof config.intercityPricePerPerson.flight).toBe("number");
    expect(config.cityTransportPrice.sedan).toBeGreaterThanOrEqual(0);
  });
});

describe("lib/countries geoOptions ↔ countries consistency", () => {
  it("every COUNTRY_OPTIONS value has pricing in BY_COUNTRY", () => {
    const pricingKeys = getPricingCountryKeys();
    for (const opt of COUNTRY_OPTIONS) {
      expect(pricingKeys).toContain(opt.value);
    }
  });

  it("every getPricingCountryKeys() key exists in CITIES_BY_COUNTRY", () => {
    const pricingKeys = getPricingCountryKeys();
    for (const country of pricingKeys) {
      expect(CITIES_BY_COUNTRY).toHaveProperty(country);
      expect(Array.isArray(CITIES_BY_COUNTRY[country])).toBe(true);
    }
  });

  it("BY_COUNTRY keys exactly match PRODUCT_COUNTRIES nameZh", () => {
    const keys = new Set(getPricingCountryKeys());
    expect(keys.size).toBe(PRODUCT_COUNTRIES.length);
    for (const c of PRODUCT_COUNTRIES) {
      expect(keys.has(c.nameZh)).toBe(true);
    }
  });
});

describe("lib/countries all configs valid and non-negative", () => {
  it("every country config satisfies type and non-negative numbers", () => {
    const keys = getPricingCountryKeys();
    for (const country of keys) {
      const config = getPricingForCountry(country);
      assertValidConfig(config);
    }
  });
});

describe("lib/countries config read-only (44 §8.1)", () => {
  it("returned configs are frozen", () => {
    const config = getPricingForCountry("中国");
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.cityTransportPrice)).toBe(true);
    expect(Object.isFrozen(config.guideLevelsSuggestedPerDay)).toBe(true);
  });
});
