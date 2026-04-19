"use client";

import type { CountryPricingConfig } from "@/lib/countries";
import type { CustomItineraryForm } from "./types";
import type { TransportLine, InterCityLine, BudgetBreakdown } from "./quoteCalculationTypes";

/** 旅行者侧报价：市内/城际交通、预算拆解与建议（从 useQuoteCalculation 拆出） */
export function computeTouristQuote(form: CustomItineraryForm, pricing: CountryPricingConfig) {
  const suggestedCityTransportFee = form.dayPlans.reduce(
    (sum, d) => sum + (d.cityTransport ? pricing.cityTransportPrice[d.cityTransport] ?? 0 : 0),
    0
  );
  const headcount = Math.max(1, form.headcount || 1);
  let suggestedInterCityFee = 0;
  for (let i = 1; i < form.dayPlans.length; i++) {
    const from = form.dayPlans[i - 1]?.city?.trim();
    const to = form.dayPlans[i]?.city?.trim();
    if (!from || !to || from === to) continue;
    const mode = form.dayPlans[i]?.transport ?? "rail";
    const price = mode === "flight" ? pricing.intercityPricePerPerson.flight : pricing.intercityPricePerPerson.rail;
    suggestedInterCityFee += price * headcount;
  }
  const suggestedTransportFee = suggestedCityTransportFee + suggestedInterCityFee;

  const touristCityTransportLines: TransportLine[] = [];
  let i = 0;
  const plans = form.dayPlans;
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
    touristCityTransportLines.push({ dayFrom: i + 1, dayTo: j + 1, vehicle: t, fee });
    i = j + 1;
  }

  let hasTouristInterCity = false;
  for (let k = 1; k < plans.length; k++) {
    const from = plans[k - 1]?.city?.trim();
    const to = plans[k]?.city?.trim();
    if (from && to && from !== to) {
      hasTouristInterCity = true;
      break;
    }
  }

  const touristInterCityTransportLines: InterCityLine[] = [];
  for (let k = 1; k < plans.length; k++) {
    const from = plans[k - 1]?.city?.trim();
    const to = plans[k]?.city?.trim();
    if (!from || !to || from === to) continue;
    const mode = plans[k]?.transport ?? "rail";
    const pricePerPerson = mode === "flight" ? pricing.intercityPricePerPerson.flight : pricing.intercityPricePerPerson.rail;
    touristInterCityTransportLines.push({
      dayFrom: k,
      dayTo: k + 1,
      mode,
      pricePerPerson,
      headcount,
      fee: pricePerPerson * headcount,
    });
  }

  const days = Math.max(1, form.totalDays);
  let attractionItems = 0;
  let foodItems = 0;
  let hotelNights = 0;
  form.dayPlans.forEach((d) => {
    attractionItems += d.attractions.length * pricing.perAttraction;
    foodItems += d.food.length * pricing.perFood;
    if (d.hotel) hotelNights += 1;
  });
  const attractionsTotal = Math.round(attractionItems * headcount);
  const foodTotal = Math.round(foodItems * headcount);
  const hotelTotal = Math.round(hotelNights * pricing.hotelPerNightPerPerson * headcount);
  const suggestedGuide = (pricing.guideLevelsSuggestedPerDay[form.needGuide] ?? 0) * days;
  const guideTotal = suggestedGuide;
  const transportTotal = suggestedTransportFee;
  const total = attractionsTotal + foodTotal + hotelTotal + transportTotal + guideTotal;
  const budgetBreakdown: BudgetBreakdown = {
    attractionsTotal,
    foodTotal,
    hotelTotal,
    hotelNights,
    transportTotal,
    guideTotal,
    total: Math.round(total),
    perDay: days > 0 ? Math.round(total / days) : 0,
    days,
    headcount,
    attractionCount: form.dayPlans.reduce((s, d) => s + d.attractions.length, 0),
    foodCount: form.dayPlans.reduce((s, d) => s + d.food.length, 0),
  };

  const budgetSuggestion =
    budgetBreakdown.total <= 0
      ? { min: 80, max: 500 }
      : { min: Math.max(80, Math.round(budgetBreakdown.total * 0.9)), max: Math.round(budgetBreakdown.total * 1.1) };

  return {
    suggestedCityTransportFee,
    suggestedInterCityFee,
    suggestedTransportFee,
    touristCityTransportLines,
    hasTouristInterCity,
    touristInterCityTransportLines,
    budgetBreakdown,
    budgetSuggestion,
  };
}
