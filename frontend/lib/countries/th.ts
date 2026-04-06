import type { CountryPricingConfig } from "./types";

/** 泰国：用车与住宿相对便宜，城际以国内航/铁路为主 */
export const pricingTH: CountryPricingConfig = {
  cityTransportPrice: { sedan: 50, suv: 80, van: 140 },
  intercityPricePerPerson: { flight: 200, rail: 80 },
  perAttraction: 12,
  perFood: 8,
  hotelPerNightPerPerson: 35,
  guideLevelsSuggestedPerDay: { primary: 100, intermediate: 180, advanced: 280, expert: 400 },
};
