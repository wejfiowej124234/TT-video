/**
 * Catalog API ↔ TS 真源双读对拍（S2-API-RO）
 * 需 API 运行 + catalog import committed；CI 可设 CATALOG_API_PARITY_SKIP=1 跳过。
 */
import { describe, expect, it } from "vitest";
import { CITIES_BY_COUNTRY } from "../geoOptions";
import { PRODUCT_COUNTRIES } from "../productCountries";
import { getAttractionDetails, getFoodDetails } from "../cityDetails/index";
import { getInterCityTransportModes } from "../cityDetails/interCityTransport";
import { HOTEL_TIERS, HOTEL_TIER_SUBMIT_LABELS } from "../cityDetails/hotels";
import { HOTEL_TIER_MULTIPLIER } from "../cityDetails/hotelTierPricing";
import { getPricingCountryKeys, getPricingForCountry } from "../countries/index";
import { landingAmbientImageUrl } from "../landingAmbientByCountry";
import {
  fetchCatalogCountries,
  fetchCatalogCities,
  fetchCatalogPois,
  fetchCatalogPricing,
  fetchCatalogIntercityRoutes,
  fetchCatalogMedia,
  fetchCatalogHotelTiers,
  fetchCatalogPoiImages,
  fetchCatalogPoiImageById,
} from "./client";
import {
  CATALOG_CITY_TRANSPORT_KEYS,
  CATALOG_GUIDE_LEVEL_KEYS,
  CATALOG_INTERCITY_PRICE_KEYS,
  CATALOG_PRICING_ITEM_KEYS,
  type CatalogPricingItem,
} from "./types";

const skip =
  process.env.CATALOG_API_PARITY_SKIP === "1" ||
  process.env.SKIP_CATALOG_API_PARITY === "1";

const apiBase = process.env.CATALOG_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

async function probeApi(): Promise<boolean> {
  if (!apiBase) return false;
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/catalog/countries`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { count?: number };
    return (body.count ?? 0) > 0;
  } catch {
    return false;
  }
}

function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

function assertPricingItemShape(row: CatalogPricingItem): void {
  for (const key of CATALOG_PRICING_ITEM_KEYS) {
    expect(row[key as keyof CatalogPricingItem], key).toBeDefined();
  }
  for (const key of CATALOG_CITY_TRANSPORT_KEYS) {
    expect(row.city_transport_price[key], `city_transport_price.${key}`).toEqual(
      expect.any(Number),
    );
  }
  for (const key of CATALOG_INTERCITY_PRICE_KEYS) {
    expect(row.intercity_price_per_person[key], `intercity.${key}`).toEqual(expect.any(Number));
  }
  for (const key of CATALOG_GUIDE_LEVEL_KEYS) {
    expect(row.guide_levels_per_day[key], `guide_levels.${key}`).toEqual(expect.any(Number));
  }
}

function assertPricingMatchesTs(row: CatalogPricingItem, countryNameZh: string): void {
  const cfg = getPricingForCountry(countryNameZh);
  expect(row.per_attraction_cents).toBe(yuanToCents(cfg.perAttraction));
  expect(row.per_food_cents).toBe(yuanToCents(cfg.perFood));
  expect(row.hotel_base_per_night_cents).toBe(yuanToCents(cfg.hotelPerNightPerPerson));
  expect(row.city_transport_price.sedan).toBe(yuanToCents(cfg.cityTransportPrice.sedan));
  expect(row.city_transport_price.suv).toBe(yuanToCents(cfg.cityTransportPrice.suv));
  expect(row.city_transport_price.van).toBe(yuanToCents(cfg.cityTransportPrice.van));
  expect(row.intercity_price_per_person.flight).toBe(
    yuanToCents(cfg.intercityPricePerPerson.flight),
  );
  expect(row.intercity_price_per_person.rail).toBe(yuanToCents(cfg.intercityPricePerPerson.rail));
  expect(row.guide_levels_per_day.primary).toBe(
    yuanToCents(cfg.guideLevelsSuggestedPerDay.primary),
  );
  expect(row.guide_levels_per_day.intermediate).toBe(
    yuanToCents(cfg.guideLevelsSuggestedPerDay.intermediate),
  );
  expect(row.guide_levels_per_day.advanced).toBe(
    yuanToCents(cfg.guideLevelsSuggestedPerDay.advanced),
  );
  expect(row.guide_levels_per_day.expert).toBe(yuanToCents(cfg.guideLevelsSuggestedPerDay.expert));
}

describe.skipIf(skip)("catalog API ↔ TS dual-read parity", () => {
  it("API-01 countries count = 10", async () => {
    if (!(await probeApi())) {
      console.warn("skip: catalog API unavailable or empty");
      return;
    }
    const res = await fetchCatalogCountries();
    expect(res.count).toBe(PRODUCT_COUNTRIES.length);
  });

  it("API-02 cities count = 38", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogCities();
    expect(res.count).toBe(38);
  });

  it("API-03 per-country city counts", async () => {
    if (!(await probeApi())) return;
    for (const pc of PRODUCT_COUNTRIES) {
      const res = await fetchCatalogCities(pc.iso);
      const geoLen = (CITIES_BY_COUNTRY[pc.nameZh] ?? []).length;
      expect(res.count).toBe(geoLen);
    }
  });

  it("API-06/07 POI counts per city", async () => {
    if (!(await probeApi())) return;
    for (const pc of PRODUCT_COUNTRIES) {
      for (const { value: city } of CITIES_BY_COUNTRY[pc.nameZh] ?? []) {
        const att = await fetchCatalogPois({ countryIso: pc.iso, city, type: "attraction" });
        const food = await fetchCatalogPois({ countryIso: pc.iso, city, type: "food" });
        expect(att.count).toBe(getAttractionDetails(city).length);
        expect(food.count).toBe(getFoodDetails(city).length);
      }
    }
  });

  it("API-08 hotel tiers count = 3", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogHotelTiers();
    expect(res.count).toBe(HOTEL_TIERS.length);
  });

  it("API-08b hotel tier fields vs TS", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogHotelTiers();
    for (const tier of HOTEL_TIERS) {
      const row = res.items.find((r) => r.tier_code === tier.value);
      expect(row, tier.value).toBeDefined();
      expect(row!.label_key).toBe(tier.labelKey);
      expect(row!.description_key).toBe(tier.descriptionKey);
      expect(row!.submit_label_zh).toBe(
        HOTEL_TIER_SUBMIT_LABELS[tier.value as keyof typeof HOTEL_TIER_SUBMIT_LABELS],
      );
      expect(row!.multiplier).toBe(HOTEL_TIER_MULTIPLIER[tier.value as keyof typeof HOTEL_TIER_MULTIPLIER]);
    }
  });

  it("API-10 pricing keys", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogPricing();
    expect(res.count).toBe(getPricingCountryKeys().length);
  });

  it("API-11 CN pricing full fields vs TS", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogPricing("CN");
    const row = res.items[0];
    expect(row).toBeDefined();
    assertPricingItemShape(row!);
    assertPricingMatchesTs(row!, "中国");
    expect(row!.currency_code).toBe("CNY");
  });

  it("API-11b all countries pricing full fields vs TS", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogPricing();
    for (const pc of PRODUCT_COUNTRIES) {
      const row = res.items.find((r) => r.country_iso === pc.iso);
      expect(row, pc.iso).toBeDefined();
      assertPricingItemShape(row!);
      assertPricingMatchesTs(row!, pc.nameZh);
    }
  });

  it("API-12 intercity sample 东京→大阪", async () => {
    if (!(await probeApi())) return;
    const tsModes = getInterCityTransportModes("东京", "大阪").sort().join(",");
    const res = await fetchCatalogIntercityRoutes("东京", "大阪");
    const dbModes = res.items.map((r) => r.mode).sort().join(",");
    expect(dbModes).toBe(tsModes);
  });

  it("API-14 landing media URLs in country payload", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogCountries();
    for (const pc of PRODUCT_COUNTRIES) {
      const row = res.items.find((c) => c.iso3166 === pc.iso);
      expect(row).toBeDefined();
      const payload = (row as { payload?: { landing_ambient?: { image_url?: string } } }).payload;
      expect(payload?.landing_ambient?.image_url).toBe(landingAmbientImageUrl(pc.nameZh));
    }
  });

  it("API media landing_ambient count >= 10", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogMedia({ assetKind: "landing_ambient" });
    expect(res.count).toBeGreaterThanOrEqual(10);
  });

  it("API-15 poi-images 北京 attraction images match TS", async () => {
    if (!(await probeApi())) return;
    const res = await fetchCatalogPoiImages({
      countryIso: "CN",
      city: "北京",
      type: "attraction",
    });
    expect(res.count).toBeGreaterThan(0);
    for (const row of res.items) {
      expect(row.image_url).toMatch(/^https?:\/\//);
      expect(["published", "payload"]).toContain(row.image_source);
      if (row.legacy_value) {
        const ts = getAttractionDetails("北京").find((d) => d.value === row.legacy_value);
        if (ts?.image) expect(row.image_url).toBe(ts.image);
      }
    }
  });

  it("API-16 poi-images/:poi_id single fetch matches list row", async () => {
    if (!(await probeApi())) return;
    const list = await fetchCatalogPoiImages({
      countryIso: "CN",
      city: "北京",
      type: "attraction",
    });
    const first = list.items[0];
    expect(first?.poi_id).toBeTruthy();
    const one = await fetchCatalogPoiImageById(first!.poi_id);
    expect(one.count).toBe(1);
    expect(one.items[0]?.image_url).toBe(first!.image_url);
  });
});
