/**
 * Custom Itinerary 报价链 shadow compare（S2b Phase 6 / W4）
 * TS 真源 vs Catalog adapter · 不切 UI · 不改变报价结果
 */
import { CITIES_BY_COUNTRY } from "../geoOptions";
import { PRODUCT_COUNTRIES } from "../productCountries";
import { getPricingForCountry } from "../countries/index";
import type { CountryPricingConfig } from "../countries/types";
import { getInterCityTransportModes, needsInterCityTransport } from "../cityDetails/interCityTransport";
import {
  mapApiCitiesToOptions,
  mapApiCountriesToOptions,
  readCitiesFromTs,
  readCountriesFromTs,
} from "./catalogGeoAdapter";
import { mapApiHotelTiersToResolved, readHotelTiersFromTs } from "./catalogHotelTierAdapter";
import { mapCatalogPricingItemToConfig } from "./catalogPricingAdapter";
import {
  mapApiIntercityRoutesToModes,
  readIntercityModesFromTs,
  type CatalogApiIntercityRouteRow,
} from "./catalogIntercityAdapter";
import {
  mapApiPoisToLegacyValues,
  readPoiLegacyValuesFromTs,
  type CatalogApiPoiRow,
  type CatalogPoiType,
} from "./catalogPoiAdapter";
import type {
  CatalogApiCityRow,
  CatalogApiCountryRow,
  CatalogApiHotelTierRow,
  CatalogPricingItem,
} from "./types";
import { defaultForm, type CustomItineraryForm } from "@/components/market/CustomItineraryModal/types";
import { computeGuideQuote, normalizeGuideDayPlans } from "@/components/market/CustomItineraryModal/quoteCalculationGuide";
import { computeTouristQuote } from "@/components/market/CustomItineraryModal/quoteCalculationTourist";

export const CATALOG_SHADOW_DOMAINS = [
  "geo_countries",
  "geo_cities",
  "pricing",
  "hotel_tiers",
  "poi_attraction",
  "poi_food",
  "intercity_modes",
  "quote_tourist",
  "quote_guide",
] as const;

export type CatalogShadowDomain = (typeof CATALOG_SHADOW_DOMAINS)[number];

export type CatalogShadowMismatch = {
  domain: CatalogShadowDomain;
  key: string;
  ts: unknown;
  catalog: unknown;
  message: string;
};

export type CatalogShadowDomainSummary = {
  checked: number;
  mismatches: number;
};

export type CatalogShadowCompareReport = {
  pass: boolean;
  skipped?: boolean;
  mismatchCount: number;
  mismatches: CatalogShadowMismatch[];
  summary: Record<CatalogShadowDomain, CatalogShadowDomainSummary>;
};

function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

function emptySummary(): Record<CatalogShadowDomain, CatalogShadowDomainSummary> {
  return Object.fromEntries(
    CATALOG_SHADOW_DOMAINS.map((d) => [d, { checked: 0, mismatches: 0 }]),
  ) as Record<CatalogShadowDomain, CatalogShadowDomainSummary>;
}

function pushMismatch(
  mismatches: CatalogShadowMismatch[],
  summary: Record<CatalogShadowDomain, CatalogShadowDomainSummary>,
  row: CatalogShadowMismatch,
): void {
  mismatches.push(row);
  summary[row.domain].mismatches += 1;
}

export function buildSyntheticPricingItemFromTs(
  countryNameZh: string,
  countryIso: string,
): CatalogPricingItem {
  const cfg = getPricingForCountry(countryNameZh);
  return {
    id: `synthetic-pricing-${countryIso}`,
    country_id: `synthetic-country-${countryIso}`,
    country_iso: countryIso,
    country_name_zh: countryNameZh,
    currency_code: "SYNTH",
    per_attraction_cents: yuanToCents(cfg.perAttraction),
    per_food_cents: yuanToCents(cfg.perFood),
    hotel_base_per_night_cents: yuanToCents(cfg.hotelPerNightPerPerson),
    city_transport_price: {
      sedan: yuanToCents(cfg.cityTransportPrice.sedan),
      suv: yuanToCents(cfg.cityTransportPrice.suv),
      van: yuanToCents(cfg.cityTransportPrice.van),
    },
    intercity_price_per_person: {
      flight: yuanToCents(cfg.intercityPricePerPerson.flight),
      rail: yuanToCents(cfg.intercityPricePerPerson.rail),
    },
    guide_levels_per_day: {
      primary: yuanToCents(cfg.guideLevelsSuggestedPerDay.primary),
      intermediate: yuanToCents(cfg.guideLevelsSuggestedPerDay.intermediate),
      advanced: yuanToCents(cfg.guideLevelsSuggestedPerDay.advanced),
      expert: yuanToCents(cfg.guideLevelsSuggestedPerDay.expert),
    },
    version: 1,
  };
}

export function buildSyntheticCountryRowsFromTs(): CatalogApiCountryRow[] {
  return PRODUCT_COUNTRIES.map((c, i) => ({
    iso3166: c.iso,
    name_zh: c.nameZh,
    sort_order: i,
  }));
}

export function buildSyntheticCityRowsFromTs(countryNameZh: string, countryIso: string): CatalogApiCityRow[] {
  return (CITIES_BY_COUNTRY[countryNameZh] ?? []).map((c) => ({
    country_iso: countryIso,
    name_zh: c.value,
    slug: c.value,
  }));
}

export function buildSyntheticHotelTierRowsFromTs(): CatalogApiHotelTierRow[] {
  return readHotelTiersFromTs().map((t, i) => ({
    tier_code: t.value,
    sort_order: i,
    multiplier: t.multiplier,
    label_key: t.labelKey,
    description_key: t.descriptionKey,
    submit_label_zh: t.submitLabelZh,
    stock_image_url: t.image || null,
  }));
}

export function buildSyntheticPoiRowsFromTs(cityNameZh: string, type: CatalogPoiType): CatalogApiPoiRow[] {
  return readPoiLegacyValuesFromTs(cityNameZh, type).map((legacy_value) => ({
    poi_type: type,
    legacy_value,
    city_name_zh: cityNameZh,
  }));
}

export function buildSyntheticIntercityRowsFromTs(fromCity: string, toCity: string): CatalogApiIntercityRouteRow[] {
  return getInterCityTransportModes(fromCity, toCity).map((mode) => ({
    mode,
    from_city_name_zh: fromCity,
    to_city_name_zh: toCity,
  }));
}

function comparePricingConfigs(
  ts: CountryPricingConfig,
  adapted: CountryPricingConfig,
  key: string,
  mismatches: CatalogShadowMismatch[],
  summary: Record<CatalogShadowDomain, CatalogShadowDomainSummary>,
): void {
  summary.pricing.checked += 1;
  const fields: Array<[string, unknown, unknown]> = [
    ["perAttraction", ts.perAttraction, adapted.perAttraction],
    ["perFood", ts.perFood, adapted.perFood],
    ["hotelPerNightPerPerson", ts.hotelPerNightPerPerson, adapted.hotelPerNightPerPerson],
    ["cityTransport.sedan", ts.cityTransportPrice.sedan, adapted.cityTransportPrice.sedan],
    ["cityTransport.suv", ts.cityTransportPrice.suv, adapted.cityTransportPrice.suv],
    ["cityTransport.van", ts.cityTransportPrice.van, adapted.cityTransportPrice.van],
    ["intercity.flight", ts.intercityPricePerPerson.flight, adapted.intercityPricePerPerson.flight],
    ["intercity.rail", ts.intercityPricePerPerson.rail, adapted.intercityPricePerPerson.rail],
    ["guide.primary", ts.guideLevelsSuggestedPerDay.primary, adapted.guideLevelsSuggestedPerDay.primary],
    ["guide.intermediate", ts.guideLevelsSuggestedPerDay.intermediate, adapted.guideLevelsSuggestedPerDay.intermediate],
    ["guide.advanced", ts.guideLevelsSuggestedPerDay.advanced, adapted.guideLevelsSuggestedPerDay.advanced],
    ["guide.expert", ts.guideLevelsSuggestedPerDay.expert, adapted.guideLevelsSuggestedPerDay.expert],
  ];
  for (const [field, tsVal, catVal] of fields) {
    if (tsVal !== catVal) {
      pushMismatch(mismatches, summary, {
        domain: "pricing",
        key: `${key}.${field}`,
        ts: tsVal,
        catalog: catVal,
        message: `pricing field mismatch: ${field}`,
      });
    }
  }
}

function buildQuoteShadowSampleForm(countryNameZh: string, creatorType: "tourist" | "guide"): CustomItineraryForm | null {
  const cities = CITIES_BY_COUNTRY[countryNameZh] ?? [];
  if (cities.length === 0) return null;
  const form = defaultForm(Math.min(3, Math.max(2, cities.length)));
  form.creatorType = creatorType;
  form.country = countryNameZh;
  form.headcount = 4;
  form.needGuide = "intermediate";
  const c0 = cities[0]!.value;
  const c1 = cities[1]?.value ?? c0;
  const att0 = readPoiLegacyValuesFromTs(c0, "attraction")[0] ?? "";
  const food0 = readPoiLegacyValuesFromTs(c0, "food")[0] ?? "";

  if (creatorType === "tourist") {
    form.dayPlans[0] = {
      city: c0,
      attractions: att0 ? [att0] : [],
      food: food0 ? [food0] : [],
      hotel: "tier_comfort",
      cityTransport: "suv",
    };
    form.dayPlans[1] = {
      city: c1,
      attractions: [],
      food: [],
      hotel: "tier_economy",
      cityTransport: "sedan",
      transport: needsInterCityTransport(c0, c1) ? "rail" : undefined,
    };
    if (form.dayPlans[2]) {
      form.dayPlans[2] = { city: c0, attractions: [], food: [], hotel: "", cityTransport: "van" };
    }
    return form;
  }

  form.guideDayPlans = form.guideDayPlans.map((_, i) => {
    if (i === 0) {
      return {
        ...form.guideDayPlans[i]!,
        city: c0,
        cityTransport: "suv",
      };
    }
    if (i === 1) {
      return {
        ...form.guideDayPlans[i]!,
        city: c1,
        cityTransport: "sedan",
        transport: needsInterCityTransport(c0, c1) ? "rail" : undefined,
      };
    }
    return { ...form.guideDayPlans[i]!, city: c0, cityTransport: "van" };
  });
  form.guideAttractionFee = "20";
  form.guideFoodFee = "15";
  return form;
}

function compareQuoteShadowForCountry(
  countryNameZh: string,
  adaptedPricing: CountryPricingConfig,
  mismatches: CatalogShadowMismatch[],
  summary: Record<CatalogShadowDomain, CatalogShadowDomainSummary>,
): void {
  const tsPricing = getPricingForCountry(countryNameZh);

  for (const creatorType of ["tourist", "guide"] as const) {
    const form = buildQuoteShadowSampleForm(countryNameZh, creatorType);
    if (!form) return;
    const domain = creatorType === "tourist" ? "quote_tourist" : "quote_guide";
    summary[domain].checked += 1;

    if (creatorType === "tourist") {
      const tsQuote = computeTouristQuote(form, tsPricing);
      const catQuote = computeTouristQuote(form, adaptedPricing);
      if (tsQuote.budgetBreakdown.total !== catQuote.budgetBreakdown.total) {
        pushMismatch(mismatches, summary, {
          domain,
          key: `${countryNameZh}.budgetBreakdown.total`,
          ts: tsQuote.budgetBreakdown,
          catalog: catQuote.budgetBreakdown,
          message: "tourist quote total mismatch",
        });
      }
      if (tsQuote.suggestedTransportFee !== catQuote.suggestedTransportFee) {
        pushMismatch(mismatches, summary, {
          domain,
          key: `${countryNameZh}.suggestedTransportFee`,
          ts: tsQuote.suggestedTransportFee,
          catalog: catQuote.suggestedTransportFee,
          message: "tourist transport fee mismatch",
        });
      }
      return;
    }

    const normalized = normalizeGuideDayPlans(form);
    const tsQuote = computeGuideQuote(form, normalized, tsPricing);
    const catQuote = computeGuideQuote(form, normalized, adaptedPricing);
    if (tsQuote.guideQuoteBreakdown.total !== catQuote.guideQuoteBreakdown.total) {
      pushMismatch(mismatches, summary, {
        domain,
        key: `${countryNameZh}.guideQuoteBreakdown.total`,
        ts: tsQuote.guideQuoteBreakdown,
        catalog: catQuote.guideQuoteBreakdown,
        message: "guide quote total mismatch",
      });
    }
  }
}

export function runOfflineCustomItineraryCatalogShadowCompare(): CatalogShadowCompareReport {
  const mismatches: CatalogShadowMismatch[] = [];
  const summary = emptySummary();

  const countryRows = buildSyntheticCountryRowsFromTs();
  summary.geo_countries.checked += 1;
  const tsCountries = readCountriesFromTs();
  const adaptedCountries = mapApiCountriesToOptions(countryRows);
  if (JSON.stringify(tsCountries) !== JSON.stringify(adaptedCountries)) {
    pushMismatch(mismatches, summary, {
      domain: "geo_countries",
      key: "all",
      ts: tsCountries,
      catalog: adaptedCountries,
      message: "country options shape/value mismatch",
    });
  }

  for (const pc of PRODUCT_COUNTRIES) {
    summary.geo_cities.checked += 1;
    const cityRows = buildSyntheticCityRowsFromTs(pc.nameZh, pc.iso);
    const tsCities = readCitiesFromTs(pc.nameZh);
    const adaptedCities = mapApiCitiesToOptions(cityRows);
    if (JSON.stringify(tsCities) !== JSON.stringify(adaptedCities)) {
      pushMismatch(mismatches, summary, {
        domain: "geo_cities",
        key: pc.nameZh,
        ts: tsCities,
        catalog: adaptedCities,
        message: "city options mismatch",
      });
    }

    const pricingItem = buildSyntheticPricingItemFromTs(pc.nameZh, pc.iso);
    const adaptedPricing = mapCatalogPricingItemToConfig(pricingItem);
    comparePricingConfigs(getPricingForCountry(pc.nameZh), adaptedPricing, pc.nameZh, mismatches, summary);
    compareQuoteShadowForCountry(pc.nameZh, adaptedPricing, mismatches, summary);

    for (const { value: city } of CITIES_BY_COUNTRY[pc.nameZh] ?? []) {
      for (const poiType of ["attraction", "food"] as const) {
        const domain = poiType === "attraction" ? "poi_attraction" : "poi_food";
        summary[domain].checked += 1;
        const tsPoi = readPoiLegacyValuesFromTs(city, poiType);
        const adaptedPoi = mapApiPoisToLegacyValues(buildSyntheticPoiRowsFromTs(city, poiType));
        if (JSON.stringify(tsPoi) !== JSON.stringify(adaptedPoi)) {
          pushMismatch(mismatches, summary, {
            domain,
            key: `${city}.${poiType}`,
            ts: tsPoi,
            catalog: adaptedPoi,
            message: "POI legacy_value list mismatch",
          });
        }
      }
    }
  }

  summary.hotel_tiers.checked += 1;
  const tsTiers = readHotelTiersFromTs();
  const adaptedTiers = mapApiHotelTiersToResolved(buildSyntheticHotelTierRowsFromTs());
  if (JSON.stringify(tsTiers) !== JSON.stringify(adaptedTiers)) {
    pushMismatch(mismatches, summary, {
      domain: "hotel_tiers",
      key: "all",
      ts: tsTiers,
      catalog: adaptedTiers,
      message: "hotel tier adapter mismatch",
    });
  }

  const intercityPairs = new Set<string>();
  for (const pc of PRODUCT_COUNTRIES) {
    const cities = (CITIES_BY_COUNTRY[pc.nameZh] ?? []).map((c) => c.value);
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const from = cities[i]!;
        const to = cities[j]!;
        if (!needsInterCityTransport(from, to)) continue;
        intercityPairs.add(`${from}→${to}`);
        summary.intercity_modes.checked += 1;
        const tsModes = readIntercityModesFromTs(from, to);
        const adaptedModes = mapApiIntercityRoutesToModes(buildSyntheticIntercityRowsFromTs(from, to));
        if (JSON.stringify(tsModes) !== JSON.stringify(adaptedModes)) {
          pushMismatch(mismatches, summary, {
            domain: "intercity_modes",
            key: `${from}→${to}`,
            ts: tsModes,
            catalog: adaptedModes,
            message: "intercity mode set mismatch",
          });
        }
      }
    }
  }

  return {
    pass: mismatches.length === 0,
    mismatchCount: mismatches.length,
    mismatches,
    summary,
  };
}

export type LiveCatalogShadowInput = {
  countries: CatalogApiCountryRow[];
  citiesByIso: Record<string, CatalogApiCityRow[]>;
  pricingByIso: Record<string, CatalogPricingItem>;
  hotelTiers: CatalogApiHotelTierRow[];
  poisByCityType: Record<string, CatalogApiPoiRow[]>;
  intercityByPair: Record<string, CatalogApiIntercityRouteRow[]>;
};

export function runLiveCustomItineraryCatalogShadowCompare(input: LiveCatalogShadowInput): CatalogShadowCompareReport {
  const mismatches: CatalogShadowMismatch[] = [];
  const summary = emptySummary();

  summary.geo_countries.checked += 1;
  const tsCountries = readCountriesFromTs();
  const adaptedCountries = mapApiCountriesToOptions(input.countries);
  if (JSON.stringify(tsCountries) !== JSON.stringify(adaptedCountries)) {
    pushMismatch(mismatches, summary, {
      domain: "geo_countries",
      key: "all",
      ts: tsCountries,
      catalog: adaptedCountries,
      message: "live country options mismatch",
    });
  }

  for (const pc of PRODUCT_COUNTRIES) {
    summary.geo_cities.checked += 1;
    const cityRows = input.citiesByIso[pc.iso] ?? [];
    const tsCities = readCitiesFromTs(pc.nameZh);
    const adaptedCities = mapApiCitiesToOptions(cityRows);
    if (JSON.stringify(tsCities) !== JSON.stringify(adaptedCities)) {
      pushMismatch(mismatches, summary, {
        domain: "geo_cities",
        key: pc.nameZh,
        ts: tsCities,
        catalog: adaptedCities,
        message: "live city options mismatch",
      });
    }

    const pricingItem = input.pricingByIso[pc.iso];
    if (pricingItem) {
      const adaptedPricing = mapCatalogPricingItemToConfig(pricingItem);
      comparePricingConfigs(getPricingForCountry(pc.nameZh), adaptedPricing, pc.nameZh, mismatches, summary);
      compareQuoteShadowForCountry(pc.nameZh, adaptedPricing, mismatches, summary);
    }

    for (const { value: city } of CITIES_BY_COUNTRY[pc.nameZh] ?? []) {
      for (const poiType of ["attraction", "food"] as const) {
        const domain = poiType === "attraction" ? "poi_attraction" : "poi_food";
        summary[domain].checked += 1;
        const key = `${pc.iso}|${city}|${poiType}`;
        const rows = input.poisByCityType[key] ?? [];
        const tsPoi = readPoiLegacyValuesFromTs(city, poiType);
        const adaptedPoi = mapApiPoisToLegacyValues(rows);
        if (JSON.stringify(tsPoi) !== JSON.stringify(adaptedPoi)) {
          pushMismatch(mismatches, summary, {
            domain,
            key: `${city}.${poiType}`,
            ts: tsPoi,
            catalog: adaptedPoi,
            message: "live POI list mismatch",
          });
        }
      }
    }
  }

  summary.hotel_tiers.checked += 1;
  const tsTiers = readHotelTiersFromTs();
  const adaptedTiers = mapApiHotelTiersToResolved(input.hotelTiers);
  if (JSON.stringify(tsTiers) !== JSON.stringify(adaptedTiers)) {
    pushMismatch(mismatches, summary, {
      domain: "hotel_tiers",
      key: "all",
      ts: tsTiers,
      catalog: adaptedTiers,
      message: "live hotel tier mismatch",
    });
  }

  for (const pairKey of Object.keys(input.intercityByPair)) {
    summary.intercity_modes.checked += 1;
    const rows = input.intercityByPair[pairKey] ?? [];
    const [from, to] = pairKey.split("→");
    if (!from || !to) continue;
    const tsModes = readIntercityModesFromTs(from, to);
    const adaptedModes = mapApiIntercityRoutesToModes(rows);
    if (JSON.stringify(tsModes) !== JSON.stringify(adaptedModes)) {
      pushMismatch(mismatches, summary, {
        domain: "intercity_modes",
        key: pairKey,
        ts: tsModes,
        catalog: adaptedModes,
        message: "live intercity mode mismatch",
      });
    }
  }

  return {
    pass: mismatches.length === 0,
    mismatchCount: mismatches.length,
    mismatches,
    summary,
  };
}

export function formatCatalogShadowReport(report: CatalogShadowCompareReport): string {
  const lines = [
    `Custom Itinerary catalog shadow compare: ${report.pass ? "PASS" : "FAIL"} (${report.mismatchCount} mismatches)`,
  ];
  for (const domain of CATALOG_SHADOW_DOMAINS) {
    const s = report.summary[domain];
    lines.push(`  ${domain}: checked=${s.checked} mismatches=${s.mismatches}`);
  }
  for (const m of report.mismatches.slice(0, 50)) {
    lines.push(`  [${m.domain}] ${m.key}: ${m.message}`);
  }
  if (report.mismatches.length > 50) {
    lines.push(`  ... and ${report.mismatches.length - 50} more`);
  }
  return lines.join("\n");
}
