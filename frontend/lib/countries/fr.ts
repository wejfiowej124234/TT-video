import type { CountryPricingConfig } from "./types";

/** 法国：欧洲用车与住宿、向导价 */
export const pricingFR: CountryPricingConfig = {
  cityTransportPrice: { sedan: 90, suv: 140, van: 240 },
  intercityPricePerPerson: { flight: 120, rail: 80 },
  perAttraction: 22,
  perFood: 18,
  hotelPerNightPerPerson: 85,
  guideLevelsSuggestedPerDay: { primary: 200, intermediate: 320, advanced: 480, expert: 700 },
};
