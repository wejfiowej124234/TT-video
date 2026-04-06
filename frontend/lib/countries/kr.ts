import type { CountryPricingConfig } from "./types";

/** 韩国：与日本同档占位（用车/城际/住宿/向导），后续可按韩元或本地调研独立调参 */
export const pricingKR: CountryPricingConfig = {
  cityTransportPrice: { sedan: 110, suv: 170, van: 300 },
  intercityPricePerPerson: { flight: 750, rail: 320 },
  perAttraction: 32,
  perFood: 24,
  hotelPerNightPerPerson: 110,
  guideLevelsSuggestedPerDay: { primary: 330, intermediate: 520, advanced: 780, expert: 1050 },
};
