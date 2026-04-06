import type { CountryPricingConfig } from "./types";

/** 新加坡：用车与住宿单价高，城际多为航班 */
export const pricingSG: CountryPricingConfig = {
  cityTransportPrice: { sedan: 100, suv: 150, van: 260 },
  intercityPricePerPerson: { flight: 350, rail: 120 },
  perAttraction: 28,
  perFood: 22,
  hotelPerNightPerPerson: 130,
  guideLevelsSuggestedPerDay: { primary: 280, intermediate: 450, advanced: 650, expert: 900 },
};
