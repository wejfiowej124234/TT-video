/**
 * Custom Itinerary 报价链 shadow compare 门禁（S2b Phase 6 / W4）
 * 不切 UI · 不改变报价 · TS 真源 vs Catalog adapter
 */
import { describe, expect, it } from "vitest";
import { CITIES_BY_COUNTRY } from "../geoOptions";
import { PRODUCT_COUNTRIES } from "../productCountries";
import { getPricingForCountry } from "../countries/index";
import { mapCatalogPricingItemToConfig } from "./catalogPricingAdapter";
import {
  buildSyntheticPricingItemFromTs,
  formatCatalogShadowReport,
  runLiveCustomItineraryCatalogShadowCompare,
  runOfflineCustomItineraryCatalogShadowCompare,
  type LiveCatalogShadowInput,
} from "./customItineraryCatalogShadowCompare";
import {
  fetchCatalogCities,
  fetchCatalogCountries,
  fetchCatalogHotelTiers,
  fetchCatalogIntercityRoutes,
  fetchCatalogPois,
  fetchCatalogPricing,
} from "./client";
import { needsInterCityTransport } from "../cityDetails/interCityTransport";
import { defaultForm } from "@/components/market/CustomItineraryModal/types";
import { computeTouristQuote } from "@/components/market/CustomItineraryModal/quoteCalculationTourist";

const skipLive =
  process.env.CATALOG_API_PARITY_SKIP === "1" ||
  process.env.SKIP_CATALOG_API_PARITY === "1" ||
  process.env.CUSTOM_ITINERARY_CATALOG_PARITY_SKIP === "1";

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

async function loadLiveShadowInput(): Promise<LiveCatalogShadowInput> {
  const countriesRes = await fetchCatalogCountries();
  const pricingRes = await fetchCatalogPricing();
  const hotelRes = await fetchCatalogHotelTiers();

  const citiesByIso: LiveCatalogShadowInput["citiesByIso"] = {};
  const pricingByIso: LiveCatalogShadowInput["pricingByIso"] = {};
  const poisByCityType: LiveCatalogShadowInput["poisByCityType"] = {};
  const intercityByPair: LiveCatalogShadowInput["intercityByPair"] = {};

  for (const pc of PRODUCT_COUNTRIES) {
    const citiesRes = await fetchCatalogCities(pc.iso);
    citiesByIso[pc.iso] = citiesRes.items;
    const row = pricingRes.items.find((r) => r.country_iso === pc.iso);
    if (row) pricingByIso[pc.iso] = row;

    for (const { value: city } of CITIES_BY_COUNTRY[pc.nameZh] ?? []) {
      for (const poiType of ["attraction", "food"] as const) {
        const key = `${pc.iso}|${city}|${poiType}`;
        const res = await fetchCatalogPois({ countryIso: pc.iso, city, type: poiType });
        poisByCityType[key] = res.items;
      }
    }
  }

  for (const pc of PRODUCT_COUNTRIES) {
    const cities = (CITIES_BY_COUNTRY[pc.nameZh] ?? []).map((c) => c.value);
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const from = cities[i]!;
        const to = cities[j]!;
        if (!needsInterCityTransport(from, to)) continue;
        const pairKey = `${from}→${to}`;
        const res = await fetchCatalogIntercityRoutes(from, to);
        intercityByPair[pairKey] = res.items;
      }
    }
  }

  return {
    countries: countriesRes.items,
    citiesByIso,
    pricingByIso,
    hotelTiers: hotelRes.items,
    poisByCityType,
    intercityByPair,
  };
}

describe("customItineraryCatalogParity · offline shadow (W4 gate)", () => {
  it("CI-01 full offline shadow compare PASS (all domains)", () => {
    const report = runOfflineCustomItineraryCatalogShadowCompare();
    if (!report.pass) {
      console.error(formatCatalogShadowReport(report));
      console.error(JSON.stringify(report.mismatches.slice(0, 10), null, 2));
    }
    expect(report.pass, formatCatalogShadowReport(report)).toBe(true);
    expect(report.mismatchCount).toBe(0);
    expect(report.summary.pricing.checked).toBe(PRODUCT_COUNTRIES.length);
    expect(report.summary.hotel_tiers.checked).toBe(1);
    expect(report.summary.geo_countries.checked).toBe(1);
  });

  it("CI-02 pricing adapter cents→元 与 TS 全字段一致（十国）", () => {
    for (const pc of PRODUCT_COUNTRIES) {
      const item = buildSyntheticPricingItemFromTs(pc.nameZh, pc.iso);
      const adapted = mapCatalogPricingItemToConfig(item);
      const ts = getPricingForCountry(pc.nameZh);
      expect(adapted).toEqual(ts);
    }
  });

  it("CI-03 quote shadow: adapter pricing 不改变 computeTouristQuote 总价", () => {
    for (const pc of PRODUCT_COUNTRIES) {
      const item = buildSyntheticPricingItemFromTs(pc.nameZh, pc.iso);
      const adapted = mapCatalogPricingItemToConfig(item);
      const ts = getPricingForCountry(pc.nameZh);
      const cities = CITIES_BY_COUNTRY[pc.nameZh] ?? [];
      if (cities.length === 0) continue;
      const form = defaultForm(2);
      form.country = pc.nameZh;
      form.dayPlans[0] = {
        city: cities[0]!.value,
        attractions: [],
        food: [],
        hotel: "tier_comfort",
        cityTransport: "sedan",
      };
      if (cities[1]) {
        form.dayPlans[1] = {
          city: cities[1].value,
          attractions: [],
          food: [],
          hotel: "",
          transport: "rail",
        };
      }
      const tsQuote = computeTouristQuote(form, ts);
      const catQuote = computeTouristQuote(form, adapted);
      expect(catQuote.budgetBreakdown.total).toBe(tsQuote.budgetBreakdown.total);
      expect(catQuote.suggestedTransportFee).toBe(tsQuote.suggestedTransportFee);
    }
  });
});

describe.skipIf(skipLive)("customItineraryCatalogParity · live API shadow (W4 gate)", () => {
  it("CI-LIVE full live shadow compare PASS", async () => {
    if (!(await probeApi())) {
      console.warn("skip: catalog API unavailable for Custom Itinerary live shadow");
      return;
    }
    const input = await loadLiveShadowInput();
    const report = runLiveCustomItineraryCatalogShadowCompare(input);
    if (!report.pass) {
      console.error(formatCatalogShadowReport(report));
      console.error(JSON.stringify(report.mismatches.slice(0, 20), null, 2));
    }
    expect(report.pass, formatCatalogShadowReport(report)).toBe(true);
  });
});
