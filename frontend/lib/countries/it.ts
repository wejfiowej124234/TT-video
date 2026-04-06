import type { CountryPricingConfig } from "./types";

/** 意大利：欧洲用车、住宿、向导价 */
export const pricingIT: CountryPricingConfig = {
  cityTransportPrice: { sedan: 85, suv: 130, van: 220 },
  intercityPricePerPerson: { flight: 100, rail: 70 },
  perAttraction: 20,
  perFood: 16,
  hotelPerNightPerPerson: 80,
  guideLevelsSuggestedPerDay: { primary: 190, intermediate: 300, advanced: 450, expert: 650 },
};
