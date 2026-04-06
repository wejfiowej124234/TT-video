import type { CountryPricingConfig } from "./types";

/** 阿联酋：海湾目的地，用车/住宿单价参照新加坡档略调（演示用 USD 口径） */
export const pricingAE: CountryPricingConfig = {
  cityTransportPrice: { sedan: 120, suv: 180, van: 300 },
  intercityPricePerPerson: { flight: 220, rail: 90 },
  perAttraction: 35,
  perFood: 28,
  hotelPerNightPerPerson: 140,
  guideLevelsSuggestedPerDay: { primary: 320, intermediate: 520, advanced: 720, expert: 980 },
};
