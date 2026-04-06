import type { CountryPricingConfig } from "./types";

/** 日本：用车与城际交通较贵，住宿与向导价高于中国（可视为日元或折算人民币） */
export const pricingJP: CountryPricingConfig = {
  cityTransportPrice: { sedan: 120, suv: 180, van: 320 },
  intercityPricePerPerson: { flight: 800, rail: 350 },
  perAttraction: 35,
  perFood: 25,
  hotelPerNightPerPerson: 120,
  guideLevelsSuggestedPerDay: { primary: 350, intermediate: 550, advanced: 800, expert: 1100 },
};
