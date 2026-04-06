"use client";

import type { CountryPricingConfig } from "@/lib/countries";
import type { CustomItineraryForm, GuideDayPlan } from "./types";
import { defaultGuideDayPlan } from "./types";
import type { TransportLine, InterCityLine, GuideQuoteBreakdown } from "./quoteCalculationTypes";

/** 向导侧报价：市内/城际交通、总价拆解（从 useQuoteCalculation 拆出） */
export function computeGuideQuote(
  form: CustomItineraryForm,
  guideDayPlansNormalized: GuideDayPlan[],
  pricing: CountryPricingConfig
) {
  const suggestedGuideCityTransportFee = guideDayPlansNormalized.reduce(
    (sum, d) => sum + (d.cityTransport ? pricing.cityTransportPrice[d.cityTransport] ?? 0 : 0),
    0
  );
  const headcount = Math.max(1, form.headcount || 1);
  let suggestedGuideInterCityFee = 0;
  const plans = guideDayPlansNormalized;
  for (let i = 1; i < plans.length; i++) {
    const from = plans[i - 1]?.city?.trim();
    const to = plans[i]?.city?.trim();
    if (!from || !to || from === to) continue;
    const mode = plans[i]?.transport ?? "rail";
    const price = mode === "flight" ? pricing.intercityPricePerPerson.flight : pricing.intercityPricePerPerson.rail;
    suggestedGuideInterCityFee += price * headcount;
  }
  const suggestedGuideTransportFee = suggestedGuideCityTransportFee + suggestedGuideInterCityFee;

  let hasGuideInterCity = false;
  for (let k = 1; k < plans.length; k++) {
    const from = plans[k - 1]?.city?.trim();
    const to = plans[k]?.city?.trim();
    if (from && to && from !== to) {
      hasGuideInterCity = true;
      break;
    }
  }

  const guideCityTransportLines: TransportLine[] = [];
  let i = 0;
  while (i < plans.length) {
    const t = plans[i].cityTransport;
    if (!t) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < plans.length && plans[j + 1].cityTransport === t) j++;
    const dayCount = j - i + 1;
    const fee = dayCount * (pricing.cityTransportPrice[t] ?? 0);
    guideCityTransportLines.push({ dayFrom: i + 1, dayTo: j + 1, vehicle: t, fee });
    i = j + 1;
  }

  const guideInterCityTransportLines: InterCityLine[] = [];
  for (let k = 1; k < plans.length; k++) {
    const from = plans[k - 1]?.city?.trim();
    const to = plans[k]?.city?.trim();
    if (!from || !to || from === to) continue;
    const mode = plans[k]?.transport ?? "rail";
    const pricePerPerson = mode === "flight" ? pricing.intercityPricePerPerson.flight : pricing.intercityPricePerPerson.rail;
    guideInterCityTransportLines.push({
      dayFrom: k,
      dayTo: k + 1,
      mode,
      pricePerPerson,
      headcount,
      fee: pricePerPerson * headcount,
    });
  }

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
