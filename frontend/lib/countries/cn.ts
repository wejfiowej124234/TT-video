import type { CountryPricingConfig } from "./types";

/** 中国：用车、城际、住宿、景区/餐饮、向导等级单价（人民币） */
export const pricingCN: CountryPricingConfig = {
  cityTransportPrice: { sedan: 80, suv: 120, van: 200 },
  intercityPricePerPerson: { flight: 400, rail: 150 },
  perAttraction: 18,
  perFood: 10,
  hotelPerNightPerPerson: 50,
  guideLevelsSuggestedPerDay: { primary: 150, intermediate: 280, advanced: 450, expert: 600 },
};
