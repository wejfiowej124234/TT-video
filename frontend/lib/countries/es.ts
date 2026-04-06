import type { CountryPricingConfig } from "./types";

/** 西班牙：欧洲用车、住宿、向导价 */
export const pricingES: CountryPricingConfig = {
  cityTransportPrice: { sedan: 75, suv: 115, van: 200 },
  intercityPricePerPerson: { flight: 90, rail: 55 },
  perAttraction: 18,
  perFood: 14,
  hotelPerNightPerPerson: 65,
  guideLevelsSuggestedPerDay: { primary: 170, intermediate: 270, advanced: 400, expert: 580 },
};
