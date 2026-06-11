"use client";

import type { CountryPricingConfig } from "@/lib/countries";
import type { CustomItineraryForm, GuideDayPlan } from "./types";
import { defaultGuideDayPlan } from "./types";
import type { GuideQuoteBreakdown } from "./quoteCalculationTypes";
import { buildCityTransportLines, buildInterCityLines } from "./quoteCalculationShared";

/** 向导侧报价：市内/城际交通、总价拆解（从 useQuoteCalculation 拆出） */
export function computeGuideQuote(
  form: CustomItineraryForm,
  guideDayPlansNormalized: GuideDayPlan[],
  pricing: CountryPricingConfig
) {
  const headcount = Math.max(1, form.headcount || 1);
  const plans = guideDayPlansNormalized;
  const cityTransport = buildCityTransportLines(plans, headcount, pricing);
  const interCity = buildInterCityLines(plans, headcount, pricing);
  const suggestedGuideCityTransportFee = cityTransport.totalFee;
  const suggestedGuideInterCityFee = interCity.totalFee;
  const suggestedGuideTransportFee = suggestedGuideCityTransportFee + suggestedGuideInterCityFee;
  const hasGuideInterCity = interCity.hasInterCity;
  const guideCityTransportLines = cityTransport.lines;
  const guideInterCityTransportLines = interCity.lines;

  const parseFee = (s: string) => {
    if (!s?.trim()) return 0;
    const n = parseFloat(s.replace(/,/g, ""));
    return !isNaN(n) && n >= 0 ? n : 0;
  };
  const days = Math.max(1, form.totalDays);
  const perPerson = { attraction: parseFee(form.guideAttractionFee), food: parseFee(form.guideFoodFee) };
  const attractionTotal = Math.round(perPerson.attraction * headcount);
  const foodTotal = Math.round(perPerson.food * headcount);
  const hotelTotal = Math.round(days * pricing.hotelPerNightPerPerson * headcount);
  const suggestedGuide = (pricing.guideLevelsSuggestedPerDay[form.needGuide] ?? 0) * days;
  const guideTotal = suggestedGuide;
  const cityTransportTotal = suggestedGuideCityTransportFee;
  const interCityTotal = hasGuideInterCity ? suggestedGuideInterCityFee : 0;
  const transportTotal = cityTransportTotal + interCityTotal;
  const total = attractionTotal + foodTotal + hotelTotal + guideTotal + transportTotal;
  const guideQuoteBreakdown: GuideQuoteBreakdown = {
    attractionTotal,
    foodTotal,
    hotelTotal,
    guideTotal,
    transportTotal,
    cityTransportFee: cityTransportTotal,
    interCityFee: interCityTotal,
    headcount,
    total: Math.round(total),
    perDay: days > 0 ? Math.round(total / days) : 0,
    days,
  };

  return {
    hasGuideInterCity,
    suggestedGuideInterCityFee,
    suggestedGuideCityTransportFee,
    guideCityTransportLines,
    guideInterCityTransportLines,
    suggestedGuideTransportFee,
    guideQuoteBreakdown,
  };
}

/** 归一化向导日计划数组（与 useQuoteCalculation 原逻辑一致） */
export function normalizeGuideDayPlans(form: CustomItineraryForm): GuideDayPlan[] {
  const len = Math.max(1, form.totalDays);
  const arr = form.guideDayPlans ?? [];
  return Array.from({ length: len }, (_, i) => ({ ...defaultGuideDayPlan(), ...arr[i] }));
}
