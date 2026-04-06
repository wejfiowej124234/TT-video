/**
 * 43 §5.3 第 9 项：useQuoteCalculation 单测（报价/预算计算逻辑）
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuoteCalculation } from "./useQuoteCalculation";
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
});
