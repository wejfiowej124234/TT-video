import type { CountryPricingConfig } from "./types";

/** 英国：用车与城际、住宿、向导价 */
export const pricingUK: CountryPricingConfig = {
  cityTransportPrice: { sedan: 88, suv: 135, van: 230 },
  intercityPricePerPerson: { flight: 110, rail: 75 },
  perAttraction: 24,
  perFood: 18,
  hotelPerNightPerPerson: 95,
  guideLevelsSuggestedPerDay: { primary: 210, intermediate: 340, advanced: 500, expert: 720 },
};
