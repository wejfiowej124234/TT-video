import type { CountryPricingConfig } from "./types";

/** 美国：用车与城际以飞机/自驾为主，住宿与向导价 */
export const pricingUS: CountryPricingConfig = {
  cityTransportPrice: { sedan: 95, suv: 145, van: 250 },
  intercityPricePerPerson: { flight: 250, rail: 120 },
  perAttraction: 28,
  perFood: 20,
  hotelPerNightPerPerson: 100,
  guideLevelsSuggestedPerDay: { primary: 220, intermediate: 360, advanced: 520, expert: 750 },
};
