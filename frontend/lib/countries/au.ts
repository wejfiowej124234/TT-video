import type { CountryPricingConfig } from "./types";

/** 澳大利亚：用车与城际、住宿、向导价 */
export const pricingAU: CountryPricingConfig = {
  cityTransportPrice: { sedan: 82, suv: 125, van: 215 },
  intercityPricePerPerson: { flight: 280, rail: 130 },
  perAttraction: 26,
  perFood: 19,
  hotelPerNightPerPerson: 88,
  guideLevelsSuggestedPerDay: { primary: 200, intermediate: 320, advanced: 470, expert: 680 },
};
