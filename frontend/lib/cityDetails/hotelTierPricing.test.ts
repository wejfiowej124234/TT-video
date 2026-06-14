import { describe, expect, it } from "vitest";
import { pricingCN } from "@/lib/countries/cn";
import { HOTEL_TIER_MULTIPLIER, hotelNightRatePerPerson } from "./hotelTierPricing";

describe("hotelTierPricing", () => {
  it("applies tier multipliers on economy base rate", () => {
    const base = pricingCN.hotelPerNightPerPerson;
    expect(hotelNightRatePerPerson("tier_economy", pricingCN)).toBe(base);
    expect(hotelNightRatePerPerson("tier_comfort", pricingCN)).toBe(
      Math.round(base * HOTEL_TIER_MULTIPLIER.tier_comfort)
    );
    expect(hotelNightRatePerPerson("tier_luxury", pricingCN)).toBe(
      Math.round(base * HOTEL_TIER_MULTIPLIER.tier_luxury)
    );
    expect(hotelNightRatePerPerson("tier_comfort", pricingCN)).toBeGreaterThan(
      hotelNightRatePerPerson("tier_economy", pricingCN)
    );
    expect(hotelNightRatePerPerson("tier_luxury", pricingCN)).toBeGreaterThan(
      hotelNightRatePerPerson("tier_comfort", pricingCN)
    );
  });
});
