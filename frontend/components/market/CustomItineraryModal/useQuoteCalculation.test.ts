/**
 * 43 §5.3 第 9 项：useQuoteCalculation 单测（报价/预算计算逻辑）
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { getPricingForCountry } from "@/lib/countries";
import { mapCatalogPricingItemToConfig } from "@/lib/catalogApi/catalogPricingAdapter";
import { buildSyntheticPricingItemFromTs } from "@/lib/catalogApi/customItineraryCatalogShadowCompare";
import { useQuoteCalculation } from "./useQuoteCalculation";
import { computeTouristQuote } from "./quoteCalculationTourist";
import { defaultForm } from "./types";

describe("useQuoteCalculation", () => {
  it("returns budgetBreakdown and guideQuoteBreakdown for default 5-day form", () => {
    const form = defaultForm(5);
    const { result } = renderHook(() => useQuoteCalculation(form));

    expect(result.current.budgetBreakdown).toBeDefined();
    expect(result.current.budgetBreakdown.days).toBe(5);
    expect(result.current.budgetBreakdown.headcount).toBe(1);
    expect(typeof result.current.budgetBreakdown.total).toBe("number");
    expect(result.current.budgetBreakdown.total).toBeGreaterThanOrEqual(0);

    expect(result.current.guideQuoteBreakdown).toBeDefined();
    expect(result.current.guideQuoteBreakdown.days).toBe(5);
    expect(result.current.guideQuoteBreakdown.headcount).toBe(1);
    expect(typeof result.current.guideQuoteBreakdown.total).toBe("number");
    expect(result.current.guideQuoteBreakdown.total).toBeGreaterThanOrEqual(0);
  });

  it("returns suggestedTransportFee and budgetSuggestion", () => {
    const form = defaultForm(3);
    const { result } = renderHook(() => useQuoteCalculation(form));

    expect(typeof result.current.suggestedTransportFee).toBe("number");
    expect(result.current.suggestedTransportFee).toBeGreaterThanOrEqual(0);
    expect(result.current.budgetSuggestion).toBeDefined();
    expect(result.current.budgetSuggestion.min).toBeGreaterThanOrEqual(0);
    expect(result.current.budgetSuggestion.max).toBeGreaterThanOrEqual(result.current.budgetSuggestion.min);
  });

  it("touristCityTransportLines and guideCityTransportLines are arrays", () => {
    const form = defaultForm(2);
    const { result } = renderHook(() => useQuoteCalculation(form));

    expect(Array.isArray(result.current.touristCityTransportLines)).toBe(true);
    expect(Array.isArray(result.current.guideCityTransportLines)).toBe(true);
  });

  it("scales city transport fee when headcount exceeds sedan capacity", () => {
    const form = defaultForm(1);
    form.country = "中国";
    form.dayPlans[0].city = "北京";
    form.dayPlans[0].cityTransport = "sedan";
    form.headcount = 1;
    const { result: solo } = renderHook(() => useQuoteCalculation(form));
    form.headcount = 5;
    const { result: group } = renderHook(() => useQuoteCalculation(form));
    expect(group.current.suggestedTransportFee).toBeGreaterThan(solo.current.suggestedTransportFee);
    expect(group.current.touristCityTransportLines[0]?.vehicleCount).toBe(2);
  });

  it("different hotel tiers produce different hotel totals", () => {
    const economy = defaultForm(1);
    economy.country = "中国";
    economy.dayPlans[0].city = "北京";
    economy.dayPlans[0].hotel = "tier_economy";
    const comfort = { ...economy, dayPlans: [{ ...economy.dayPlans[0], hotel: "tier_comfort" }] };
    const luxury = { ...economy, dayPlans: [{ ...economy.dayPlans[0], hotel: "tier_luxury" }] };
    const { result: e } = renderHook(() => useQuoteCalculation(economy));
    const { result: c } = renderHook(() => useQuoteCalculation(comfort));
    const { result: l } = renderHook(() => useQuoteCalculation(luxury));
    expect(c.current.budgetBreakdown.hotelTotal).toBeGreaterThan(e.current.budgetBreakdown.hotelTotal);
    expect(l.current.budgetBreakdown.hotelTotal).toBeGreaterThan(c.current.budgetBreakdown.hotelTotal);
  });

  it("W4 shadow: adapter pricing yields identical tourist total (中国 sample)", () => {
    const form = defaultForm(2);
    form.country = "中国";
    form.headcount = 3;
    form.dayPlans[0] = {
      city: "北京",
      attractions: ["故宫"],
      food: ["全聚德烤鸭"],
      hotel: "tier_comfort",
      cityTransport: "suv",
    };
    form.dayPlans[1] = {
      city: "上海",
      attractions: [],
      food: [],
      hotel: "tier_economy",
      transport: "rail",
      cityTransport: "sedan",
    };
    const tsPricing = getPricingForCountry("中国");
    const adapted = mapCatalogPricingItemToConfig(buildSyntheticPricingItemFromTs("中国", "CN"));
    const tsQuote = computeTouristQuote(form, tsPricing);
    const catQuote = computeTouristQuote(form, adapted);
    expect(catQuote.budgetBreakdown.total).toBe(tsQuote.budgetBreakdown.total);
  });
});
