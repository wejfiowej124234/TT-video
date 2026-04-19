"use client";

import { useMemo } from "react";
import { DEFAULT_COUNTRY, getPricingForCountry } from "@/lib/countries";
import type { CustomItineraryForm } from "./types";
import { computeTouristQuote } from "./quoteCalculationTourist";
import { computeGuideQuote, normalizeGuideDayPlans } from "./quoteCalculationGuide";

export type { TransportLine, InterCityLine, GuideQuoteBreakdown, BudgetBreakdown } from "./quoteCalculationTypes";

/** 行程报价计算：组合旅行者侧与向导侧纯函数，保持 hook 薄层 */
export function useQuoteCalculation(form: CustomItineraryForm) {
  const pricing = useMemo(() => getPricingForCountry(form.country || DEFAULT_COUNTRY), [form.country]);
  const guideDayPlansNormalized = useMemo(() => normalizeGuideDayPlans(form), [form]);

  const tourist = useMemo(() => computeTouristQuote(form, pricing), [form, pricing]);
  const guide = useMemo(
    () => computeGuideQuote(form, guideDayPlansNormalized, pricing),
    [form, guideDayPlansNormalized, pricing]
  );

  return {
    ...tourist,
    guideDayPlansNormalized,
    ...guide,
  };
}
