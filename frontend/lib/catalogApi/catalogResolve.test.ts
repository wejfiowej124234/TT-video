/**
 * Catalog adapter resolve 单测（S2b Phase 3 · 无 UI · 无 HTTP 默认）
 */
import { describe, expect, it, vi } from "vitest";
import { CITIES_BY_COUNTRY, COUNTRY_OPTIONS } from "../geoOptions";
import { getPricingForCountry } from "../countries/index";
import { HOTEL_TIERS, HOTEL_TIER_SUBMIT_LABELS } from "../cityDetails/hotels";
import { getAttractionDetails } from "../cityDetails/index";
import { HOTEL_TIER_MULTIPLIER } from "../cityDetails/hotelTierPricing";
import {
  mapApiCitiesToOptions,
  mapApiCountriesToOptions,
  mapApiCountriesToProductCountries,
  readCitiesFromTs,
  readCountriesFromTs,
  readProductCountriesFromTs,
} from "./catalogGeoAdapter";
import {
  mapApiHotelTiersToResolved,
  readHotelTiersFromTs,
} from "./catalogHotelTierAdapter";
import { mapCatalogPricingItemToConfig } from "./catalogPricingAdapter";
import type { CatalogApiClient, CatalogResolveDeps } from "./deps";
import {
  resolveCatalogCities,
  resolveCatalogCountries,
  resolveCatalogHotelTiers,
  resolveCatalogPoiDetails,
  resolveCatalogPricing,
  resolveCatalogProductCountries,
} from "./resolve";
import type { CatalogPricingItem } from "./types";

const CN_PRICING_ITEM: CatalogPricingItem = {
  id: "00000000-0000-4000-8000-000000000001",
  country_id: "00000000-0000-4000-8000-000000000002",
  country_iso: "CN",
  country_name_zh: "中国",
  currency_code: "CNY",
  per_attraction_cents: 1800,
  per_food_cents: 1000,
  hotel_base_per_night_cents: 5000,
  city_transport_price: { sedan: 8000, suv: 12000, van: 20000 },
  intercity_price_per_person: { flight: 40000, rail: 15000 },
  guide_levels_per_day: {
    primary: 15000,
    intermediate: 28000,
    advanced: 45000,
    expert: 60000,
  },
  version: 1,
};

function mockApi(overrides: Partial<CatalogApiClient> = {}): CatalogApiClient {
  return {
    fetchCountries: vi.fn().mockResolvedValue({
      status: "ok",
      count: 1,
      items: [{ iso3166: "CN", name_zh: "中国", sort_order: 0 }],
    }),
    fetchCities: vi.fn().mockResolvedValue({
      status: "ok",
      count: 2,
      items: [
        { country_iso: "CN", name_zh: "北京", slug: "beijing" },
        { country_iso: "CN", name_zh: "上海", slug: "shanghai" },
      ],
    }),
    fetchPricing: vi.fn().mockResolvedValue({
      status: "ok",
      count: 1,
      items: [CN_PRICING_ITEM],
    }),
    fetchHotelTiers: vi.fn().mockResolvedValue({
      status: "ok",
      count: 3,
      items: HOTEL_TIERS.map((t, i) => ({
        tier_code: t.value,
        sort_order: i,
        multiplier: HOTEL_TIER_MULTIPLIER[t.value],
        label_key: t.labelKey,
        description_key: t.descriptionKey,
        submit_label_zh: HOTEL_TIER_SUBMIT_LABELS[t.value],
        stock_image_url: t.image,
      })),
    }),
    fetchPois: vi.fn().mockResolvedValue({
      status: "ok",
      count: getAttractionDetails("北京").length,
      items: getAttractionDetails("北京").map((a, i) => ({
        poi_type: "attraction",
        legacy_value: a.value,
        city_name_zh: "北京",
        name_zh: a.label,
        description_zh: a.description,
        sort_order: i,
      })),
    }),
    fetchPoiImages: vi.fn().mockResolvedValue({
      status: "ok",
      count: getAttractionDetails("北京").length,
      items: getAttractionDetails("北京").map((a, i) => ({
        poi_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        legacy_value: a.value,
        city_name_zh: "北京",
        country_iso: "CN",
        poi_type: "attraction",
        image_url: a.image,
        image_source: "payload",
      })),
    }),
    ...overrides,
  };
}

function deps(enabled: boolean, api: CatalogApiClient): CatalogResolveDeps {
  return { isEnabled: () => enabled, api };
}

describe("catalog adapter field mapping", () => {
  it("mapCatalogPricingItemToConfig matches getPricingForCountry 中国", () => {
    const mapped = mapCatalogPricingItemToConfig(CN_PRICING_ITEM);
    const ts = getPricingForCountry("中国");
    expect(mapped).toEqual(ts);
  });

  it("mapApiCountriesToOptions preserves COUNTRY_OPTIONS order shape", () => {
    const mapped = mapApiCountriesToOptions(
      COUNTRY_OPTIONS.map((c, i) => ({
        iso3166: "XX",
        name_zh: c.value,
        sort_order: i,
      })),
    );
    expect(mapped).toEqual(readCountriesFromTs());
  });

  it("mapApiCitiesToOptions matches TS 北京/上海", () => {
    const mapped = mapApiCitiesToOptions([
      { country_iso: "CN", name_zh: "北京", slug: "beijing" },
      { country_iso: "CN", name_zh: "上海", slug: "shanghai" },
    ]);
    expect(mapped).toEqual(readCitiesFromTs("中国").slice(0, 2));
  });

  it("mapApiHotelTiersToResolved matches readHotelTiersFromTs", () => {
    const apiRows = HOTEL_TIERS.map((t, i) => ({
      tier_code: t.value,
      sort_order: i,
      multiplier: HOTEL_TIER_MULTIPLIER[t.value],
      label_key: t.labelKey,
      description_key: t.descriptionKey,
      submit_label_zh: HOTEL_TIER_SUBMIT_LABELS[t.value],
      stock_image_url: t.image,
    }));
    expect(mapApiHotelTiersToResolved(apiRows)).toEqual(readHotelTiersFromTs());
  });
});

describe("resolveCatalog* flag=0 (TS only)", () => {
  const api = mockApi();

  it("resolveCatalogCountries → ts", async () => {
    const r = await resolveCatalogCountries(deps(false, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readCountriesFromTs());
    expect(api.fetchCountries).not.toHaveBeenCalled();
  });

  it("resolveCatalogCities → ts", async () => {
    const r = await resolveCatalogCities("中国", deps(false, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readCitiesFromTs("中国"));
    expect(api.fetchCities).not.toHaveBeenCalled();
  });

  it("resolveCatalogPricing → ts", async () => {
    const r = await resolveCatalogPricing("中国", deps(false, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(getPricingForCountry("中国"));
    expect(api.fetchPricing).not.toHaveBeenCalled();
  });

  it("resolveCatalogHotelTiers → ts", async () => {
    const r = await resolveCatalogHotelTiers(deps(false, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readHotelTiersFromTs());
    expect(api.fetchHotelTiers).not.toHaveBeenCalled();
  });
});

describe("resolveCatalog* flag=1 API success", () => {
  it("resolveCatalogCountries → catalog-api", async () => {
    const api = mockApi();
    const r = await resolveCatalogCountries(deps(true, api));
    expect(r.source).toBe("catalog-api");
    expect(r.data[0]?.value).toBe("中国");
    expect(api.fetchCountries).toHaveBeenCalledOnce();
  });

  it("resolveCatalogCities → catalog-api", async () => {
    const api = mockApi();
    const r = await resolveCatalogCities("中国", deps(true, api));
    expect(r.source).toBe("catalog-api");
    expect(r.data.length).toBe(2);
    expect(api.fetchCities).toHaveBeenCalledWith("CN");
  });

  it("resolveCatalogPricing → catalog-api with yuan fields", async () => {
    const api = mockApi();
    const r = await resolveCatalogPricing("中国", deps(true, api));
    expect(r.source).toBe("catalog-api");
    expect(r.data.perAttraction).toBe(18);
    expect(r.data.guideLevelsSuggestedPerDay.expert).toBe(600);
    expect(api.fetchPricing).toHaveBeenCalledWith("CN");
  });

  it("resolveCatalogHotelTiers → catalog-api", async () => {
    const api = mockApi();
    const r = await resolveCatalogHotelTiers(deps(true, api));
    expect(r.source).toBe("catalog-api");
    expect(r.data.length).toBe(3);
    expect(r.data[0]?.value).toBe("tier_economy");
  });
});

describe("resolveCatalog* flag=1 API failure → TS fallback", () => {
  it("countries fetch reject", async () => {
    const api = mockApi({
      fetchCountries: vi.fn().mockRejectedValue(new Error("network")),
    });
    const r = await resolveCatalogCountries(deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readCountriesFromTs());
  });

  it("cities empty items", async () => {
    const api = mockApi({
      fetchCities: vi.fn().mockResolvedValue({ status: "ok", count: 0, items: [] }),
    });
    const r = await resolveCatalogCities("中国", deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readCitiesFromTs("中国"));
  });

  it("pricing missing row", async () => {
    const api = mockApi({
      fetchPricing: vi.fn().mockResolvedValue({ status: "ok", count: 0, items: [] }),
    });
    const r = await resolveCatalogPricing("中国", deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(getPricingForCountry("中国"));
  });

  it("hotel tiers fetch reject", async () => {
    const api = mockApi({
      fetchHotelTiers: vi.fn().mockRejectedValue(new Error("503")),
    });
    const r = await resolveCatalogHotelTiers(deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readHotelTiersFromTs());
  });

  it("unknown country skips API and uses TS cities", async () => {
    const api = mockApi();
    const r = await resolveCatalogCities("不存在国", deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual([]);
    expect(api.fetchCities).not.toHaveBeenCalled();
  });
});

describe("resolveCatalogCities TS parity sample", () => {
  it("中国 cities count = geoOptions", async () => {
    const r = await resolveCatalogCities("中国", deps(false, mockApi()));
    expect(r.data.length).toBe(CITIES_BY_COUNTRY["中国"]?.length ?? 0);
  });
});

describe("resolveCatalogPoiDetails", () => {
  it("flag=0 returns TS attraction details", async () => {
    const r = await resolveCatalogPoiDetails("北京", "中国", "attraction", deps(false, mockApi()));
    expect(r.source).toBe("ts");
    expect(r.data.map((d) => d.value)).toEqual(getAttractionDetails("北京").map((d) => d.value));
  });

  it("flag=1 API success maps to TS-equivalent display shape", async () => {
    const r = await resolveCatalogPoiDetails("北京", "中国", "attraction", deps(true, mockApi()));
    expect(r.source).toBe("catalog-api");
    expect(r.data).toEqual(getAttractionDetails("北京"));
  });

  it("flag=1 empty pois falls back TS", async () => {
    const api = mockApi({
      fetchPois: vi.fn().mockResolvedValue({ status: "ok", count: 0, items: [] }),
    });
    const r = await resolveCatalogPoiDetails("北京", "中国", "attraction", deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(getAttractionDetails("北京"));
  });

  it("flag=1 published poi-images override payload/TS image", async () => {
    const catalogUrl = "https://cdn.example.com/catalog/gugong.jpg";
    const api = mockApi({
      fetchPoiImages: vi.fn().mockResolvedValue({
        status: "ok",
        count: 1,
        items: [
          {
            poi_id: "00000000-0000-4000-8000-000000000001",
            legacy_value: "故宫",
            city_name_zh: "北京",
            country_iso: "CN",
            poi_type: "attraction",
            image_url: catalogUrl,
            image_source: "published",
          },
        ],
      }),
    });
    const r = await resolveCatalogPoiDetails("北京", "中国", "attraction", deps(true, api));
    expect(r.source).toBe("catalog-api");
    const gugong = r.data.find((d) => d.value === "故宫");
    expect(gugong?.image).toBe(catalogUrl);
  });

  it("flag=1 poi-images failure still maps pois with TS fallback images", async () => {
    const api = mockApi({
      fetchPoiImages: vi.fn().mockRejectedValue(new Error("network")),
    });
    const r = await resolveCatalogPoiDetails("北京", "中国", "attraction", deps(true, api));
    expect(r.source).toBe("catalog-api");
    expect(r.data.find((d) => d.value === "故宫")?.image).toBe(
      getAttractionDetails("北京").find((d) => d.value === "故宫")?.image,
    );
  });
});

describe("resolveCatalogProductCountries", () => {
  it("flag=0 returns TS product rows with guideRegisterLabelKey", async () => {
    const r = await resolveCatalogProductCountries(deps(false, mockApi()));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readProductCountriesFromTs());
    expect(r.data[0]).toHaveProperty("guideRegisterLabelKey");
  });

  it("flag=1 API success maps iso + merges labelKey from TS", async () => {
    const api = mockApi({
      fetchCountries: vi.fn().mockResolvedValue({
        status: "ok",
        count: 1,
        items: [
          {
            id: "x",
            iso3166: "CN",
            name_zh: "中国",
            sort_order: 0,
            version: 1,
          },
        ],
      }),
    });
    const r = await resolveCatalogProductCountries(deps(true, api));
    expect(r.source).toBe("catalog-api");
    expect(r.data[0]?.iso).toBe("CN");
    expect(r.data[0]?.guideRegisterLabelKey).toBeTruthy();
  });

  it("flag=1 empty countries falls back TS", async () => {
    const api = mockApi({
      fetchCountries: vi.fn().mockResolvedValue({ status: "ok", count: 0, items: [] }),
    });
    const r = await resolveCatalogProductCountries(deps(true, api));
    expect(r.source).toBe("ts");
    expect(r.data).toEqual(readProductCountriesFromTs());
  });
});
