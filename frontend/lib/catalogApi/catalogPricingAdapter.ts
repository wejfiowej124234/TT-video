/**
 * Catalog pricing adapter — API cents → `CountryPricingConfig` 元口径（S2b Phase 3）
 */
import { getPricingForCountry } from "../countries/index";
import type { CountryPricingConfig } from "../countries/types";
import type { CatalogPricingItem } from "./types";

export function centsToYuan(cents: number): number {
  return cents / 100;
}

export function mapCatalogPricingItemToConfig(item: CatalogPricingItem): CountryPricingConfig {
  const y = centsToYuan;
  return {
    cityTransportPrice: {
      sedan: y(item.city_transport_price.sedan),
      suv: y(item.city_transport_price.suv),
      van: y(item.city_transport_price.van),
    },
    intercityPricePerPerson: {
      flight: y(item.intercity_price_per_person.flight),
      rail: y(item.intercity_price_per_person.rail),
    },
    perAttraction: y(item.per_attraction_cents),
    perFood: y(item.per_food_cents),
    hotelPerNightPerPerson: y(item.hotel_base_per_night_cents),
    guideLevelsSuggestedPerDay: {
      primary: y(item.guide_levels_per_day.primary),
      intermediate: y(item.guide_levels_per_day.intermediate),
      advanced: y(item.guide_levels_per_day.advanced),
      expert: y(item.guide_levels_per_day.expert),
    },
  };
}

export function readPricingFromTs(countryNameZh: string): CountryPricingConfig {
  return getPricingForCountry(countryNameZh);
}
