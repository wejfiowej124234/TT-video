"use client";

import type { CountryPricingConfig } from "@/lib/countries";
import { hotelNightRatePerPerson } from "@/lib/cityDetails/hotelTierPricing";
import type { CustomItineraryForm } from "./types";
import type { BudgetBreakdown } from "./quoteCalculationTypes";
import { buildCityTransportLines, buildInterCityLines } from "./quoteCalculationShared";

/** 旅行者侧报价：市内/城际交通、预算拆解与建议（从 useQuoteCalculation 拆出） */
export function computeTouristQuote(form: CustomItineraryForm, pricing: CountryPricingConfig) {
  const headcount = Math.max(1, form.headcount || 1);
  const cityTransport = buildCityTransportLines(form.dayPlans, headcount, pricing);
  const interCity = buildInterCityLines(form.dayPlans, headcount, pricing);
  const suggestedCityTransportFee = cityTransport.totalFee;
  const suggestedInterCityFee = interCity.totalFee;
  const suggestedTransportFee = suggestedCityTransportFee + suggestedInterCityFee;

  const days = Math.max(1, form.totalDays);
  let attractionItems = 0;
  let foodItems = 0;
  let hotelNights = 0;
  let hotelTotal = 0;
  form.dayPlans.forEach((d) => {
    attractionItems += d.attractions.length * pricing.perAttraction;
    foodItems += d.food.length * pricing.perFood;
    if (d.hotel) {
      hotelNights += 1;
      hotelTotal += hotelNightRatePerPerson(d.hotel, pricing) * headcount;
    }
  });
  const attractionsTotal = Math.round(attractionItems * headcount);
  const foodTotal = Math.round(foodItems * headcount);
  hotelTotal = Math.round(hotelTotal);
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
    touristCityTransportLines: cityTransport.lines,
    hasTouristInterCity: interCity.hasInterCity,
    touristInterCityTransportLines: interCity.lines,
    budgetBreakdown,
    budgetSuggestion,
  };
}
